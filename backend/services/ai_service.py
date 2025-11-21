"""
AI Service - Generates intelligent activity suggestions

This is the main entry point for generating gym recommendations.
It uses rule-based logic (MVP) to suggest optimal gyms during free time blocks.

Future: Could be enhanced with machine learning or Claude API.
"""


class GymRecommendationAI:
    """AI service for generating intelligent gym recommendations"""
    
    # Constants for recommendation logic
    MIN_WORKOUT = 30  # Minimum workout duration (minutes)
    MIN_COMMUTE_BUFFER = 10  # Minimum buffer for commute (minutes)
    SAFETY_BUFFER = 5  # Extra safety buffer (minutes)
    
    def __init__(self, location_optimizer, location_service):
        """
        Initialize the AI recommendation service
        
        Args:
            location_optimizer: LocationOptimizer instance for ranking gyms
            location_service: LocationService instance for accessing location data
        """
        self.optimizer = location_optimizer
        self.location_service = location_service
    
    def generate_suggestions(self, input_data):
        """
        Main entry point for generating gym suggestions
        
        Args:
            input_data (dict): {
                'free_time_blocks': [
                    {
                        'date': date,
                        'start_time': 'HH:MM',
                        'end_time': 'HH:MM',
                        'previous_class_location': building_id,
                        'next_class_location': building_id,
                        'available_minutes': int
                    },
                    ...
                ],
                'activity_duration_minutes': int (e.g., 60),
                'activity_type': str (default: 'gym')
            }
        
        Returns:
            dict: {
                'suggestions': [
                    {
                        'rank': int,
                        'date': date,
                        'start_time': 'HH:MM',
                        'end_time': 'HH:MM',
                        'location_name': str,
                        'location_id': str,
                        'location_address': str,
                        'activity': str,
                        'confidence_score': float,
                        'reasoning': str,
                        'commute_info': {...}
                    },
                    ...
                ]
            }
        
        Example:
            suggestions = ai_service.generate_suggestions({
                'free_time_blocks': free_blocks,
                'activity_duration_minutes': 60
            })
        """
        suggestions = []
        
        free_blocks = input_data.get('free_time_blocks', [])
        activity_duration = input_data.get('activity_duration_minutes', 60)
        activity_type = input_data.get('activity_type', 'gym')
        
        # Process each free time block
        for block in free_blocks:
            # Check if block is suitable for activity
            if self._is_suitable(block, activity_duration):
                # Generate suggestions for this block
                block_suggestions = self._process_block(block, activity_duration, activity_type)
                suggestions.extend(block_suggestions)
        
        return {'suggestions': suggestions}
    
    def _is_suitable(self, block, activity_duration):
        """
        Check if a time block is suitable for the activity
        
        Args:
            block (dict): Free time block
            activity_duration (int): Desired activity duration
        
        Returns:
            bool: True if block has enough time
        """
        available = block.get('available_minutes', 0)
        
        # Minimum required: commute (estimate 20min) + activity + buffer
        min_required = (self.MIN_COMMUTE_BUFFER * 2 + 
                       activity_duration + 
                       self.SAFETY_BUFFER)
        
        return available >= min_required
    
    def _process_block(self, block, activity_duration, activity_type='gym'):
        """
        Process a single free time block to generate suggestions
        
        Args:
            block (dict): Free time block with location info
            activity_duration (int): Desired activity duration
            activity_type (str): Type of activity (default: 'gym')
        
        Returns:
            list: Suggestions for this time block
        """
        # Get locations based on activity type
        if activity_type == 'gym':
            locations = self.location_service.get_locations_by_type('gym')
        elif activity_type == 'dining':
            locations = self.location_service.get_locations_by_type('dining')
        elif activity_type == 'study':
            locations = self.location_service.get_locations_by_type('library')
        else:
            locations = self.location_service.get_locations_by_type('gym')
        
        # Get previous and next class locations
        prev_id = block.get('previous_class_location')
        next_id = block.get('next_class_location')
        
        prev_loc = self.location_service.get_location_by_id(prev_id)
        next_loc = self.location_service.get_location_by_id(next_id)
        
        if not prev_loc or not next_loc:
            # Can't generate suggestions without location data
            return []
        
        # Use optimizer to find and rank feasible options
        ranked_options = self.optimizer.find_optimal_gyms(
            prev_loc,
            next_loc,
            block['available_minutes'],
            activity_duration,
            locations
        )
        
        # Convert top 3 options to suggestions
        suggestions = []
        for rank, option in enumerate(ranked_options[:3], 1):
            suggestion = self._create_suggestion(
                rank,
                block,
                option,
                activity_duration,
                activity_type
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def _create_suggestion(self, rank, block, option, activity_duration, activity_type):
        """
        Create a formatted suggestion from an optimizer option
        
        Args:
            rank (int): Ranking (1, 2, or 3)
            block (dict): Free time block
            option (dict): Optimizer option with gym and scores
            activity_duration (int): Activity duration
            activity_type (str): Activity type
        
        Returns:
            dict: Formatted suggestion
        """
        gym = option['gym']
        
        # Calculate confidence score (higher rank = lower confidence)
        confidence = 1.0 - (rank - 1) * 0.15
        confidence = max(confidence, 0.5)  # Minimum 0.5
        
        # Generate human-readable reasoning
        reasoning = self._generate_reasoning(option, block)
        
        # Format activity name
        activity_name = {
            'gym': 'Exercise',
            'dining': 'Meal',
            'study': 'Study Session'
        }.get(activity_type, 'Activity')
        
        return {
            'rank': rank,
            'date': str(block['date']),
            'start_time': block['start_time'],
            'end_time': block['end_time'],
            'location_name': gym['name'],
            'location_id': gym['id'],
            'location_address': gym.get('address', ''),
            'activity': activity_name,
            'activity_duration': activity_duration,
            'confidence_score': round(confidence, 2),
            'reasoning': reasoning,
            'commute_info': {
                'time_to': option['time_to_gym'],
                'time_from': option['time_from_gym'],
                'total_commute': option['total_commute'],
                'spare_time': option['spare_time']
            },
            'previous_class': block.get('previous_class_name', 'Previous class'),
            'next_class': block.get('next_class_name', 'Next class')
        }
    
    def _generate_reasoning(self, option, block):
        """
        Generate human-readable explanation for the suggestion
        
        Args:
            option (dict): Optimizer option
            block (dict): Free time block
        
        Returns:
            str: Reasoning text
        """
        total_commute = option['total_commute']
        spare = option['spare_time']
        utilization = option.get('utilization', 0)
        
        # Build reasoning based on key metrics
        reasons = []
        
        # Commute evaluation
        if total_commute < 15:
            reasons.append(f"Excellent location - only {total_commute} min total commute")
        elif total_commute < 25:
            reasons.append(f"Good location with {total_commute} min commute")
        else:
            reasons.append(f"Feasible with {total_commute} min commute")
        
        # Time utilization
        if utilization >= 85:
            reasons.append("Great use of your free time")
        elif utilization >= 70:
            reasons.append("Efficient time usage")
        
        # Spare time evaluation
        if spare >= 10:
            reasons.append(f"{spare} min buffer for flexibility")
        elif spare >= 5:
            reasons.append("Comfortable timing")
        else:
            reasons.append("Tight schedule - be prompt")
        
        return ". ".join(reasons) + "."
    
    def get_suggestion_summary(self, suggestions_result):
        """
        Get a summary of generated suggestions
        
        Args:
            suggestions_result (dict): Result from generate_suggestions()
        
        Returns:
            dict: Summary information
        """
        suggestions = suggestions_result.get('suggestions', [])
        
        # Group by date
        dates = set(s['date'] for s in suggestions)
        
        # Group by location
        locations = {}
        for s in suggestions:
            loc_id = s['location_id']
            if loc_id not in locations:
                locations[loc_id] = {
                    'name': s['location_name'],
                    'count': 0
                }
            locations[loc_id]['count'] += 1
        
        return {
            'total_suggestions': len(suggestions),
            'unique_dates': len(dates),
            'unique_locations': len(locations),
            'top_locations': sorted(
                locations.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:3]
        }

