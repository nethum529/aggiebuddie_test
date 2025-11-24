"""
CSV Buildings to JSON Converter

Converts aggiebuddiebuild(in).csv to JSON format compatible with LocationService.

Usage:
    python convert_csv_buildings_to_json.py

Input:
    ../../data/aggiebuddiebuild(in).csv

Output:
    buildings.json (in same directory as this script)
"""

import csv
import json
import os
import re
from datetime import datetime


def generate_building_id(name):
    """
    Generate URL-friendly ID from building name
    
    Examples:
    - "Zachry Engineering Education Complex" -> "zachry-engineering-education-complex"
    - "AI Engineering Building (AIEN)" -> "ai-engineering-building-aien"
    - "1111 Research Parkway Bldg" -> "1111-research-parkway-bldg"
    
    Args:
        name (str): Building name
    
    Returns:
        str: URL-friendly ID
    """
    if not name:
        return ""
    
    # Convert to lowercase
    id_str = name.lower()
    
    # Extract abbreviation from parentheses if present
    # Example: "AI Engineering Building (AIEN)" -> "AI Engineering Building AIEN"
    paren_match = re.search(r'\(([^)]+)\)', id_str)
    if paren_match:
        abbreviation = paren_match.group(1)
        # Remove parentheses and add abbreviation
        id_str = re.sub(r'\([^)]+\)', f' {abbreviation}', id_str)
    
    # Replace spaces and special characters with hyphens
    id_str = re.sub(r'[^a-z0-9\s-]', '', id_str)
    id_str = re.sub(r'\s+', '-', id_str)
    
    # Remove multiple consecutive hyphens
    id_str = re.sub(r'-+', '-', id_str)
    
    # Remove leading/trailing hyphens
    id_str = id_str.strip('-')
    
    return id_str


def parse_coordinates(lat_str, lng_str):
    """
    Parse latitude and longitude from CSV strings
    
    Args:
        lat_str: Latitude as string (e.g., "30.62139")
        lng_str: Longitude as string (e.g., "-96.34045")
    
    Returns:
        dict: {"latitude": float, "longitude": float} or None if invalid
    """
    try:
        lat = float(lat_str.strip())
        lng = float(lng_str.strip())
        
        # Validate range (TAMU campus is roughly 30.5-30.7 lat, -96.3 to -96.4 lng)
        # Using wider range to catch edge cases
        if 30.0 <= lat <= 31.0 and -97.0 <= lng <= -96.0:
            return {"latitude": lat, "longitude": lng}
        else:
            print(f"Warning: Coordinates out of range - lat: {lat}, lng: {lng}")
    except (ValueError, AttributeError, TypeError) as e:
        print(f"Warning: Invalid coordinate format - lat: {lat_str}, lng: {lng_str}, error: {e}")
    
    return None


def main():
    """Main conversion function"""
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # CSV file path (two levels up from backend/data to project root, then into data folder)
    csv_path = os.path.join(script_dir, '..', '..', 'data', 'aggiebuddiebuild(in).csv')
    
    # Output JSON path
    output_path = os.path.join(script_dir, 'buildings.json')
    
    buildings = []
    skipped_count = 0
    duplicate_ids = set()
    
    print(f"Reading CSV from: {csv_path}")
    
    try:
        with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                # Extract data
                name = row.get('Name', '').strip()
                address = row.get('Address', '').strip()
                lat_str = row.get('Coordinates (Latitude)', '').strip()
                lng_str = row.get('Coordinates (Longitude)', '').strip()
                
                # Skip empty rows
                if not name:
                    skipped_count += 1
                    continue
                
                # Generate ID
                building_id = generate_building_id(name)
                
                # Check for duplicate IDs
                if building_id in duplicate_ids:
                    # Append row number to make unique
                    building_id = f"{building_id}-{row_num}"
                duplicate_ids.add(building_id)
                
                # Parse coordinates
                coordinates = parse_coordinates(lat_str, lng_str)
                if not coordinates:
                    print(f"  Row {row_num}: Skipping '{name}' - invalid coordinates")
                    skipped_count += 1
                    continue
                
                # Create building object
                building = {
                    "id": building_id,
                    "name": name,
                    "type": "academic_building",  # Default type for CSV buildings
                    "address": address if address else None,
                    "coordinates": coordinates,
                    "hours": None  # Not available in CSV
                }
                
                buildings.append(building)
        
        # Create output structure
        output = {
            "buildings": buildings,
            "source": "aggiebuddiebuild(in).csv",
            "converted_date": datetime.now().isoformat(),
            "count": len(buildings),
            "metadata": {
                "total_rows_processed": row_num - 1,
                "skipped_count": skipped_count,
                "successful_conversions": len(buildings)
            }
        }
        
        # Write to JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Conversion complete!")
        print(f"  Converted: {len(buildings)} buildings")
        print(f"  Skipped: {skipped_count} rows")
        print(f"  Output: {output_path}")
        print(f"\nSample building:")
        if buildings:
            print(json.dumps(buildings[0], indent=2))
        
    except FileNotFoundError:
        print(f"✗ Error: CSV file not found at {csv_path}")
        print(f"  Please ensure the file exists at: aggie-buddie/data/aggiebuddiebuild(in).csv")
        return 1
    except Exception as e:
        print(f"✗ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())

