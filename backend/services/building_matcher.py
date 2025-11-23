"""
Building Matcher Service - Matches ICS location strings to campus building IDs

This service provides intelligent matching between ICS file location fields
(e.g., "ZACH", "BLOC 102") and campus building IDs in the locations dataset.

Matching Strategy:
1. Direct abbreviation mapping (ZACH → Zachry Engineering) - High confidence
2. Fuzzy name matching (case-insensitive partial match) - Medium confidence
3. Room number extraction (ZACH 350 → ZACH)
"""

from typing import Optional, Dict, List
import re


class BuildingMatcher:
    """Service for matching ICS location strings to building IDs"""
    
    def __init__(self, location_service):
        """
        Initialize the building matcher
        
        Args:
            location_service: LocationService instance for querying buildings
        """
        self.location_service = location_service
        self.abbreviation_map = self._build_abbreviation_map()
    
    def _build_abbreviation_map(self) -> Dict[str, str]:
        """
        Build mapping of common building abbreviations to building IDs
        
        Returns:
            dict: {abbreviation: building_id}
        
        Examples:
            "ZACH" → "zachry-engineering-education-complex"
            "BLOC" → "bright-learning-complex"
        """
        # Get all buildings from location service
        all_buildings = self.location_service.get_all_locations()
        
        # Filter for academic buildings (exclude gyms, dining, study)
        academic_buildings = [
            b for b in all_buildings 
            if b.get('type') not in ['gym', 'dining', 'library', 'study']
        ]
        
        # Build abbreviation map
        abbreviation_map = {}
        
        for building in academic_buildings:
            name = building.get('name', '')
            building_id = building.get('id', '')
            
            if not name or not building_id:
                continue
            
            # Extract common abbreviations from building names
            # Strategy: Use first word or common acronyms
            
            # Method 1: First word uppercase (e.g., "Zachry" → "ZACHRY")
            words = name.split()
            if words:
                first_word = words[0].upper()
                # Only add if it's a reasonable abbreviation (3-6 chars)
                if 3 <= len(first_word) <= 6:
                    abbreviation_map[first_word] = building_id
            
            # Method 2: Extract acronyms (all caps words)
            # e.g., "H.R. Bright Building" → "HRBB"
            acronym = ''.join([w[0].upper() for w in words if w and w[0].isupper()])
            if len(acronym) >= 3 and len(acronym) <= 6:
                abbreviation_map[acronym] = building_id
            
            # Method 3: Common known abbreviations (manual mapping for popular buildings)
            known_abbreviations = {
                'Zachry Engineering Education Complex': ['ZACH', 'ZACHRY', 'ZEC'],
                'Bright Learning Complex': ['BLOC', 'BRIGHT'],
                'Evans Library': ['EVAN', 'EVANS', 'LIB'],
                'H.R. Bright Building': ['HRBB', 'BRIGHT'],
                'Memorial Student Center': ['MSC'],
                'Wehner Building': ['WEHNER', 'WH'],
                'Blocker Building': ['BLOCKER', 'BL'],
                'Zachry Engineering Center': ['ZACH', 'ZACHRY'],
            }
            
            for full_name, abbrevs in known_abbreviations.items():
                if full_name.lower() in name.lower():
                    for abbrev in abbrevs:
                        abbreviation_map[abbrev] = building_id
        
        return abbreviation_map
    
    def extract_building_abbreviation(self, location_string: str) -> str:
        """
        Extract building abbreviation from ICS location string
        
        Args:
            location_string: Location from ICS file (e.g., "ZACH 350", "BLOC 102")
        
        Returns:
            str: Building abbreviation (e.g., "ZACH", "BLOC")
        
        Examples:
            "ZACH 350" → "ZACH"
            "BLOC 102" → "BLOC"
            "Zachry Engineering" → "ZACHRY"
            "Online" → "ONLINE"
        """
        if not location_string:
            return ""
        
        # Convert to uppercase for consistency
        location_upper = location_string.upper().strip()
        
        # Handle "Online" or virtual classes
        if 'ONLINE' in location_upper or 'VIRTUAL' in location_upper or 'ZOOM' in location_upper:
            return "ONLINE"
        
        # Extract first word (building abbreviation)
        # Remove common prefixes/suffixes
        location_upper = re.sub(r'^(BUILDING|BLDG|BLD|B)\.?\s*', '', location_upper)
        
        # Split by space and take first meaningful word
        words = location_upper.split()
        if words:
            # First word is usually the building abbreviation
            abbreviation = words[0]
            # Remove trailing punctuation
            abbreviation = re.sub(r'[^\w]', '', abbreviation)
            return abbreviation
        
        return location_upper
    
    def match_building(self, location_string: str) -> Optional[Dict]:
        """
        Match ICS location string to a campus building
        
        Args:
            location_string: Location from ICS file (e.g., "ZACH 350", "BLOC 102")
        
        Returns:
            dict or None: {
                'building_id': str,
                'building_name': str,
                'confidence': str,  # 'high', 'medium', 'low'
                'match_method': str  # 'abbreviation', 'fuzzy', 'none'
            }
        
        Matching Strategy:
        1. Extract building abbreviation
        2. Try direct abbreviation map lookup
        3. Try fuzzy name matching
        4. Return None if no match
        """
        if not location_string or not location_string.strip():
            return None
        
        # Extract building abbreviation
        abbreviation = self.extract_building_abbreviation(location_string)
        
        if not abbreviation or abbreviation == "ONLINE":
            return None
        
        # Method 1: Direct abbreviation mapping (highest confidence)
        if abbreviation in self.abbreviation_map:
            building_id = self.abbreviation_map[abbreviation]
            building = self.location_service.get_location_by_id(building_id)
            
            if building:
                return {
                    'building_id': building_id,
                    'building_name': building.get('name', ''),
                    'confidence': 'high',
                    'match_method': 'abbreviation',
                    'original_location': location_string,
                    'matched_abbreviation': abbreviation
                }
        
        # Method 2: Fuzzy name matching (medium confidence)
        # Search for buildings with name containing the abbreviation
        all_buildings = self.location_service.get_all_locations()
        academic_buildings = [
            b for b in all_buildings 
            if b.get('type') not in ['gym', 'dining', 'library', 'study']
        ]
        
        # Case-insensitive partial match
        fuzzy_matches = [
            b for b in academic_buildings
            if abbreviation.upper() in b.get('name', '').upper()
            or b.get('name', '').upper().startswith(abbreviation.upper())
        ]
        
        if fuzzy_matches:
            # Take first match (most likely)
            building = fuzzy_matches[0]
            return {
                'building_id': building.get('id', ''),
                'building_name': building.get('name', ''),
                'confidence': 'medium',
                'match_method': 'fuzzy',
                'original_location': location_string,
                'matched_abbreviation': abbreviation
            }
        
        # No match found
        return None
    
    def match_multiple_classes(self, classes: List[Dict]) -> Dict[str, Dict]:
        """
        Match building locations for multiple classes
        
        Args:
            classes: List of class objects with 'location' field
        
        Returns:
            dict: {
                'course_id': {
                    'building_id': str,
                    'building_name': str,
                    'confidence': str,
                    'match_method': str
                },
                ...
            }
        """
        matches = {}
        
        for cls in classes:
            course_id = cls.get('course_id') or cls.get('name') or cls.get('id')
            location = cls.get('location', '')
            
            if not course_id or not location:
                continue
            
            match = self.match_building(location)
            
            if match:
                matches[course_id] = match
        
        return matches
    
    def get_match_statistics(self, matches: Dict[str, Dict]) -> Dict:
        """
        Get statistics about matching results
        
        Args:
            matches: Dictionary of matches from match_multiple_classes
        
        Returns:
            dict: Statistics about matches
        """
        total = len(matches)
        high_confidence = sum(1 for m in matches.values() if m.get('confidence') == 'high')
        medium_confidence = sum(1 for m in matches.values() if m.get('confidence') == 'medium')
        low_confidence = sum(1 for m in matches.values() if m.get('confidence') == 'low')
        
        return {
            'total_matches': total,
            'high_confidence': high_confidence,
            'medium_confidence': medium_confidence,
            'low_confidence': low_confidence,
            'match_rate': f"{(total / max(total, 1)) * 100:.1f}%" if total > 0 else "0%"
        }

