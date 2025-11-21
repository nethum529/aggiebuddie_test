"""
Location Service - Manages campus location data

This service provides access to the campus locations dataset without
any GPS tracking. All location data is static and loaded from JSON.

Privacy: NO GPS TRACKING - Only uses building locations from schedule.
"""

import json
import os
from datetime import datetime


class LocationService:
    """Service for loading and querying campus location data"""
    
    def __init__(self, data_file='data/campus_locations.json'):
        """
        Initialize the location service by loading campus locations
        
        Args:
            data_file: Path to the campus locations JSON file
        
        Raises:
            FileNotFoundError: If the data file doesn't exist
            json.JSONDecodeError: If the JSON is invalid
        """
        self.data_file = data_file
        self.data = None
        self.locations = []
        
        # Load the data
        self._load_data()
    
    def _load_data(self):
        """Load location data from JSON file"""
        # Get the directory of this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to backend, then into data
        data_path = os.path.join(current_dir, '..', self.data_file)
        
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
                self.locations = self.data.get('locations', [])
                print(f"✓ Loaded {len(self.locations)} campus locations")
        except FileNotFoundError:
            raise FileNotFoundError(f"Campus locations file not found: {data_path}")
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in campus locations file: {e}")
    
    def get_all_locations(self):
        """
        Get all locations in the dataset
        
        Returns:
            list: All location objects
        """
        return self.locations
    
    def get_locations_by_type(self, location_type):
        """
        Filter locations by type
        
        Args:
            location_type (str): Type of location ('gym', 'dining', 'library', etc.)
        
        Returns:
            list: Locations matching the specified type
        
        Example:
            gyms = location_service.get_locations_by_type('gym')
            # Returns: [Student Rec, Southside Rec, Polo Road Rec]
        """
        return [loc for loc in self.locations if loc.get('type') == location_type]
    
    def get_location_by_id(self, location_id):
        """
        Get a specific location by its ID
        
        Args:
            location_id (str): Unique identifier for the location
        
        Returns:
            dict: Location object, or None if not found
        
        Example:
            zach = location_service.get_location_by_id('zachry-engineering-education-complex')
            # Returns: {id, name, address, coordinates, hours, ...}
        """
        for loc in self.locations:
            if loc.get('id') == location_id:
                return loc
        return None
    
    def get_location_by_name(self, name):
        """
        Get a location by name (case-insensitive partial match)
        
        Args:
            name (str): Location name or partial name
        
        Returns:
            list: Matching locations
        """
        name_lower = name.lower()
        return [loc for loc in self.locations 
                if name_lower in loc.get('name', '').lower()]
    
    def is_location_open(self, location_id, check_datetime):
        """
        Check if a location is open at a specific time
        
        Args:
            location_id (str): Location to check
            check_datetime (datetime): Time to check (Python datetime object)
        
        Returns:
            bool: True if location is open, False otherwise
        
        Example:
            is_open = location_service.is_location_open(
                'polo-road-rec-center',
                datetime(2025, 11, 24, 14, 0)  # Monday at 2pm
            )
        """
        location = self.get_location_by_id(location_id)
        if not location:
            return False
        
        # Get the day name (lowercase)
        day = check_datetime.strftime('%A').lower()
        
        # Get hours for this day
        hours = location.get('hours', {}).get(day)
        if not hours:
            return False
        
        # Check if location has hours for this day
        open_time = hours.get('open')
        close_time = hours.get('close')
        
        if not open_time or not close_time:
            return False
        
        # Parse times
        try:
            open_hour, open_min = map(int, open_time.split(':'))
            close_hour, close_min = map(int, close_time.split(':'))
            
            check_time = check_datetime.time()
            
            open_dt = check_datetime.replace(hour=open_hour, minute=open_min, second=0).time()
            close_dt = check_datetime.replace(hour=close_hour, minute=close_min, second=0).time()
            
            return open_dt <= check_time <= close_dt
        except (ValueError, AttributeError):
            return False
    
    def get_location_hours(self, location_id, day=None):
        """
        Get operating hours for a location
        
        Args:
            location_id (str): Location to check
            day (str, optional): Specific day (e.g., 'monday'). If None, returns all days
        
        Returns:
            dict or None: Hours information
        """
        location = self.get_location_by_id(location_id)
        if not location:
            return None
        
        hours = location.get('hours', {})
        
        if day:
            return hours.get(day.lower())
        return hours

