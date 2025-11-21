"""
Distance Service - Calculates walking distances and times between locations

Uses the Haversine formula to calculate distances between GPS coordinates.
Converts distances to walking time estimates with a buffer for campus terrain.

NO GPS TRACKING - Only calculates distances between known building coordinates.
"""

import math


class DistanceService:
    """Service for calculating distances and walking times between campus locations"""
    
    # Constants
    WALKING_SPEED_MPH = 3.5  # Average walking speed
    EARTH_RADIUS_M = 6371000  # Earth radius in meters
    CAMPUS_BUFFER = 1.2  # 20% buffer for campus walking (stairs, crowds, etc.)
    
    def __init__(self):
        """Initialize the distance service"""
        pass
    
    def calculate_distance(self, loc_a, loc_b):
        """
        Calculate straight-line distance between two locations using Haversine formula
        
        Args:
            loc_a (dict): First location with 'coordinates' key {latitude, longitude}
            loc_b (dict): Second location with 'coordinates' key {latitude, longitude}
        
        Returns:
            float: Distance in meters
        
        Raises:
            ValueError: If coordinates are missing or invalid
        
        Example:
            distance = distance_service.calculate_distance(zach, student_rec)
            # Returns: 450.23 (meters)
        """
        try:
            coords_a = loc_a['coordinates']
            coords_b = loc_b['coordinates']
            
            lat1 = coords_a['latitude']
            lon1 = coords_a['longitude']
            lat2 = coords_b['latitude']
            lon2 = coords_b['longitude']
            
        except (KeyError, TypeError) as e:
            raise ValueError(f"Invalid location coordinates: {e}")
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(dlon / 2) ** 2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance_meters = self.EARTH_RADIUS_M * c
        
        return distance_meters
    
    def meters_to_miles(self, meters):
        """
        Convert meters to miles
        
        Args:
            meters (float): Distance in meters
        
        Returns:
            float: Distance in miles
        """
        return meters * 0.000621371
    
    def calculate_walking_time(self, loc_a, loc_b):
        """
        Calculate walking time between two locations
        
        Args:
            loc_a (dict): Starting location with coordinates
            loc_b (dict): Ending location with coordinates
        
        Returns:
            int: Walking time in minutes (rounded up)
        
        Example:
            # ZACH to Student Rec
            time = distance_service.calculate_walking_time(zach, student_rec)
            # Returns: 6 (minutes)
        """
        # Calculate distance in meters
        distance_m = self.calculate_distance(loc_a, loc_b)
        
        # Convert to miles
        distance_mi = self.meters_to_miles(distance_m)
        
        # Calculate time in hours
        time_hours = distance_mi / self.WALKING_SPEED_MPH
        
        # Convert to minutes
        time_minutes = time_hours * 60
        
        # Apply campus buffer (20% longer due to stairs, crowds, etc.)
        buffered_time = time_minutes * self.CAMPUS_BUFFER
        
        # Round up to nearest minute (always give extra time)
        return math.ceil(buffered_time)
    
    def calculate_walking_time_minutes_only(self, loc_a, loc_b):
        """
        Alias for calculate_walking_time (for clarity)
        
        Returns:
            int: Walking time in minutes
        """
        return self.calculate_walking_time(loc_a, loc_b)
    
    def is_walking_distance_feasible(self, loc_a, loc_b, available_minutes):
        """
        Check if walking between two locations is feasible in the given time
        
        Args:
            loc_a (dict): Starting location
            loc_b (dict): Ending location
            available_minutes (int): Available time in minutes
        
        Returns:
            bool: True if walk is feasible, False otherwise
        
        Example:
            # Can I walk from ZACH to Student Rec in 10 minutes?
            feasible = distance_service.is_walking_distance_feasible(
                zach, student_rec, 10
            )
        """
        walking_time = self.calculate_walking_time(loc_a, loc_b)
        return walking_time <= available_minutes
    
    def get_distance_info(self, loc_a, loc_b):
        """
        Get comprehensive distance information between two locations
        
        Args:
            loc_a (dict): Starting location
            loc_b (dict): Ending location
        
        Returns:
            dict: {
                'distance_meters': float,
                'distance_miles': float,
                'walking_time_minutes': int,
                'from_name': str,
                'to_name': str
            }
        """
        distance_m = self.calculate_distance(loc_a, loc_b)
        distance_mi = self.meters_to_miles(distance_m)
        walking_time = self.calculate_walking_time(loc_a, loc_b)
        
        return {
            'distance_meters': round(distance_m, 2),
            'distance_miles': round(distance_mi, 3),
            'walking_time_minutes': walking_time,
            'from_name': loc_a.get('name', 'Unknown'),
            'to_name': loc_b.get('name', 'Unknown')
        }

