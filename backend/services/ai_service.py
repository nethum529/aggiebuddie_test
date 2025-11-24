"""
AI Service - Generates intelligent activity suggestions using DeepSeek API

Uses DeepSeek AI for intelligent, personalized activity recommendations.
Falls back to rule-based logic if API is unavailable.
"""

from .deepseek_client import DeepSeekClient
import logging

logger = logging.getLogger(__name__)


class GymRecommendationAI:
    """AI service for generating intelligent activity suggestions"""
    
    # Constants for fallback recommendation logic
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
        self.deepseek = DeepSeekClient()
    
    def generate_suggestions(self, input_data):
        """
        Main entry point for generating activity suggestions
        
        Uses DeepSeek AI as primary method, falls back to rule-based if unavailable.
        
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
                        'date': str (YYYY-MM-DD),
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
        """
        free_blocks = input_data.get('free_time_blocks', [])
        activity_duration = input_data.get('activity_duration_minutes', 60)
        activity_type = input_data.get('activity_type', 'gym')
        
        if not free_blocks:
            logger.warning("No free time blocks provided")
            return {'suggestions': []}
        
        # Get available locations based on activity type
        if activity_type == 'gym':
            locations = self.location_service.get_locations_by_type('gym')
        elif activity_type == 'dining':
            locations = self.location_service.get_locations_by_type('dining')
        elif activity_type == 'study':
            locations = self.location_service.get_locations_by_type('library')
        else:
            locations = self.location_service.get_locations_by_type('gym')
        
        if not locations:
            logger.warning(f"No locations available for activity type: {activity_type}")
            return {'suggestions': []}
        
        # Try DeepSeek API first
        logger.info(f"Attempting to generate suggestions using DeepSeek API for {len(free_blocks)} time blocks")
        ai_result = self.deepseek.generate_suggestions(
            free_blocks,
            activity_type,
            activity_duration,
            locations
        )
        
        if ai_result['suggestions'] and not ai_result['error']:
            # Use AI suggestions
            logger.info(f"✅ Using DeepSeek AI suggestions: {len(ai_result['suggestions'])} suggestions generated")
            formatted = self._format_ai_suggestions(ai_result['suggestions'], free_blocks, locations, activity_type, activity_duration)
            return {'suggestions': formatted}
        else:
            # Fallback to rule-based
            error_msg = ai_result.get('error', 'Unknown error')
            logger.warning(f"⚠️ DeepSeek API unavailable ({error_msg}), using rule-based fallback")
            return self._generate_fallback_suggestions(input_data, locations)
    
    def _format_ai_suggestions(self, ai_suggestions, free_blocks, locations, activity_type, activity_duration):
        """Format AI suggestions to match expected format"""
        formatted = []
        location_map = {loc['id']: loc for loc in locations}
        
        for sugg in ai_suggestions:
            # Find matching free block
            matching_block = None
            sugg_date = sugg.get('date', '')
            sugg_start = sugg.get('start_time', '')
            
            for block in free_blocks:
                block_date = str(block.get('date', ''))
                block_start = block.get('start_time', '')
                
                if block_date == sugg_date and block_start == sugg_start:
                    matching_block = block
                    break
            
            if not matching_block:
                logger.warning(f"No matching free block found for suggestion: {sugg_date} {sugg_start}")
                continue
            
            # Get location details
            location_id = sugg.get('location_id', '')
            location = location_map.get(location_id)
            
            if not location:
                logger.warning(f"Location not found: {location_id}")
                continue
            
            # Calculate commute info using optimizer
            commute_info = self._calculate_commute_info(matching_block, location)
            
            formatted.append({
                'rank': sugg.get('rank', 1),
                'date': sugg.get('date', str(matching_block['date'])),
                'start_time': sugg.get('start_time', matching_block['start_time']),
                'end_time': sugg.get('end_time', matching_block['end_time']),
                'location_name': location.get('name', sugg.get('location_name', '')),
                'location_id': location.get('id', sugg.get('location_id', '')),
                'location_address': location.get('address', ''),
                'activity': self._get_activity_name(activity_type),
                'activity_duration': activity_duration,
                'confidence_score': sugg.get('confidence', 0.8),
                'reasoning': sugg.get('reasoning', 'AI-generated suggestion'),
                'commute_info': commute_info,
                'previous_class': matching_block.get('previous_class_name', 'Previous class'),
                'next_class': matching_block.get('next_class_name', 'Next class')
            })
        
        return formatted
    
    def _calculate_commute_info(self, block, location):
        """Calculate commute information using optimizer"""
        try:
            prev_id = block.get('previous_class_location')
            next_id = block.get('next_class_location')
            
            prev_loc = self.location_service.get_location_by_id(prev_id) if prev_id else None
            next_loc = self.location_service.get_location_by_id(next_id) if next_id else None
            
            if prev_loc and next_loc:
                # Use optimizer to calculate commute times
                available_minutes = block.get('available_minutes', 0)
                activity_duration = 60  # Default, will be overridden
                
                # Get optimal options (we just need commute times)
                options = self.optimizer.find_optimal_gyms(
                    prev_loc,
                    next_loc,
                    available_minutes,
                    activity_duration,
                    [location]
                )
                
                if options:
                    option = options[0]
                    return {
                        'time_to': option.get('time_to_gym', 5),
                        'time_from': option.get('time_from_gym', 5),
                        'total_commute': option.get('total_commute', 10),
                        'spare_time': option.get('spare_time', 0)
                    }
        except Exception as e:
            logger.warning(f"Error calculating commute info: {e}")
        
        # Fallback values
        return {
            'time_to': 5,
            'time_from': 5,
            'total_commute': 10,
            'spare_time': block.get('available_minutes', 0) - 60 - 10
        }
    
    def _generate_fallback_suggestions(self, input_data, locations):
        """Fallback to rule-based suggestions if AI unavailable"""
        suggestions = []
        
        free_blocks = input_data.get('free_time_blocks', [])
        activity_duration = input_data.get('activity_duration_minutes', 60)
        activity_type = input_data.get('activity_type', 'gym')
        
        # Process each free time block
        for block in free_blocks:
            # Check if block is suitable for activity
            if self._is_suitable(block, activity_duration):
                # Generate suggestions for this block
                block_suggestions = self._process_block(block, activity_duration, activity_type, locations)
                suggestions.extend(block_suggestions)
        
        logger.info(f"Generated {len(suggestions)} fallback suggestions")
        return {'suggestions': suggestions}
    
    def _is_suitable(self, block, activity_duration):
        """Check if a time block is suitable for the activity"""
        available = block.get('available_minutes', 0)
        
        # Minimum required: commute (estimate 20min) + activity + buffer
        min_required = (self.MIN_COMMUTE_BUFFER * 2 + 
                       activity_duration + 
                       self.SAFETY_BUFFER)
        
        return available >= min_required
    
    def _process_block(self, block, activity_duration, activity_type, locations):
        """Process a single free time block to generate suggestions (fallback)"""
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
        """Create a formatted suggestion from an optimizer option (fallback)"""
        gym = option['gym']
        
        # Calculate confidence score (higher rank = lower confidence)
        confidence = 1.0 - (rank - 1) * 0.15
        confidence = max(confidence, 0.5)  # Minimum 0.5
        
        # Generate human-readable reasoning
        reasoning = self._generate_reasoning(option, block)
        
        # Format activity name
        activity_name = self._get_activity_name(activity_type)
        
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
        """Generate human-readable explanation for the suggestion (fallback)"""
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
    
    def _get_activity_name(self, activity_type):
        """Get human-readable activity name"""
        names = {
            'gym': 'Exercise',
            'dining': 'Meal',
            'study': 'Study Session'
        }
        return names.get(activity_type, 'Activity')
    
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
