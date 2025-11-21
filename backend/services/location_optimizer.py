"""
Location Optimizer - Ranks and scores gym options based on commute and availability

Analyzes feasibility of visiting a gym between classes and ranks options
based on total commute time, balance, and spare time.

Lower score = better option
"""


class LocationOptimizer:
    """Service for optimizing and ranking location suggestions"""
    
    def __init__(self, distance_service):
        """
        Initialize the location optimizer
        
        Args:
            distance_service: DistanceService instance for calculating walking times
        """
        self.distance_service = distance_service
    
    def find_optimal_gyms(self, previous_loc, next_loc, available_minutes, 
                          activity_minutes, available_gyms):
        """
        Find and rank feasible gyms for a time block
        
        Args:
            previous_loc (dict): Location of previous class
            next_loc (dict): Location of next class
            available_minutes (int): Total available minutes in the gap
            activity_minutes (int): Desired activity duration (e.g., 60 min workout)
            available_gyms (list): List of gym location objects to consider
        
        Returns:
            list: Ranked list of feasible gym options, each with:
                {
                    'gym': gym location object,
                    'time_to_gym': int (minutes),
                    'time_from_gym': int (minutes),
                    'total_commute': int (minutes),
                    'spare_time': int (minutes after activity and commute),
                    'score': float (lower is better)
                }
        
        Example:
            # 90 minute gap between MATH in BLOC and CSCE in ZACH
            # Want 60 minute workout
            options = optimizer.find_optimal_gyms(
                bloc, zach, 90, 60, all_gyms
            )
            # Returns sorted list: [best_gym, second_best, ...]
        """
        feasible = []
        
        for gym in available_gyms:
            # Calculate walking times
            time_to = self.distance_service.calculate_walking_time(previous_loc, gym)
            time_from = self.distance_service.calculate_walking_time(gym, next_loc)
            
            # Total time needed
            total_needed = time_to + activity_minutes + time_from
            
            # Add safety buffer (5 minutes for changing, etc.)
            buffer = 5
            
            # Check if feasible
            if total_needed + buffer <= available_minutes:
                spare = available_minutes - total_needed
                
                # Calculate optimization score
                score = self._calculate_score(
                    time_to, 
                    time_from, 
                    spare,
                    total_needed + buffer,
                    available_minutes
                )
                
                feasible.append({
                    'gym': gym,
                    'time_to_gym': time_to,
                    'time_from_gym': time_from,
                    'total_commute': time_to + time_from,
                    'spare_time': spare,
                    'score': score,
                    'utilization': round((total_needed / available_minutes) * 100, 1)
                })
        
        # Sort by score (lower is better)
        return sorted(feasible, key=lambda x: x['score'])
    
    def _calculate_score(self, time_to, time_from, spare, total_used, total_available):
        """
        Calculate optimization score for a gym option
        
        Lower score = better option
        
        Scoring factors:
        1. Total commute time (minimize)
        2. Balance between to/from times (prefer balanced routes)
        3. Spare time (prefer some buffer, not too much waste)
        4. Time utilization (prefer good use of available time)
        
        Args:
            time_to (int): Minutes to gym
            time_from (int): Minutes from gym
            spare (int): Spare minutes after all activities
            total_used (int): Total minutes used
            total_available (int): Total minutes available
        
        Returns:
            float: Optimization score (lower is better)
        """
        # Factor 1: Total commute (weight: 2.0)
        # Heavily penalize long commutes
        total_commute = time_to + time_from
        commute_score = total_commute * 2.0
        
        # Factor 2: Imbalance penalty (weight: 0.5)
        # Prefer balanced routes (not 20min there, 2min back)
        imbalance = abs(time_to - time_from)
        imbalance_penalty = imbalance * 0.5
        
        # Factor 3: Spare time evaluation
        # Too little spare = risky, too much = wasted
        if spare < 5:
            # Very tight - risky
            spare_penalty = 20
        elif spare > 20:
            # Too much wasted time
            spare_penalty = spare * 0.3
        else:
            # Good amount of buffer
            spare_penalty = 0
        
        # Factor 4: Utilization bonus
        # Reward good use of time (70-90% utilization)
        utilization = (total_used / total_available)
        if 0.70 <= utilization <= 0.90:
            # Sweet spot - using time well
            utilization_bonus = -5
        elif utilization > 0.90:
            # Too tight
            utilization_bonus = 10
        else:
            # Not using time efficiently
            utilization_bonus = (1 - utilization) * 10
        
        # Calculate final score
        score = (commute_score + 
                imbalance_penalty + 
                spare_penalty + 
                utilization_bonus)
        
        return score
    
    def get_top_n_options(self, previous_loc, next_loc, available_minutes,
                         activity_minutes, available_gyms, n=3):
        """
        Get top N gym options (convenience method)
        
        Args:
            previous_loc, next_loc, available_minutes, activity_minutes, available_gyms: Same as find_optimal_gyms
            n (int): Number of top options to return (default: 3)
        
        Returns:
            list: Top N gym options
        """
        all_options = self.find_optimal_gyms(
            previous_loc, next_loc, available_minutes,
            activity_minutes, available_gyms
        )
        
        return all_options[:n]
    
    def is_option_feasible(self, previous_loc, gym_loc, next_loc,
                          available_minutes, activity_minutes):
        """
        Quick check if a specific gym is feasible for a time block
        
        Args:
            previous_loc (dict): Previous class location
            gym_loc (dict): Gym to check
            next_loc (dict): Next class location
            available_minutes (int): Available time
            activity_minutes (int): Desired activity duration
        
        Returns:
            bool: True if feasible, False otherwise
        """
        time_to = self.distance_service.calculate_walking_time(previous_loc, gym_loc)
        time_from = self.distance_service.calculate_walking_time(gym_loc, next_loc)
        
        total_needed = time_to + activity_minutes + time_from + 5  # +5 buffer
        
        return total_needed <= available_minutes

