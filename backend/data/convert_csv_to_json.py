"""
Convert campus locations CSV to JSON format
"""
import csv
import json

def parse_hours(hours_str):
    """Parse hours string into structured format"""
    if not hours_str or hours_str.strip() == '':
        return None
    if hours_str.strip().lower() == 'closed':
        return {"open": None, "close": None}
    if hours_str.strip() == '24/7':
        return {"open": "00:00", "close": "23:59"}
    
    # Handle formats like "7:00 am - 2:30 pm" or "7:00 am - 2:30 pm, 5:00 pm - 9:00 pm"
    # For MVP, we'll just use the first time range
    if ',' in hours_str:
        hours_str = hours_str.split(',')[0].strip()
    
    parts = hours_str.split(' - ')
    if len(parts) == 2:
        open_time = convert_to_24h(parts[0].strip())
        close_time = convert_to_24h(parts[1].strip())
        return {"open": open_time, "close": close_time}
    
    return None

def convert_to_24h(time_str):
    """Convert 12-hour time to 24-hour format"""
    time_str = time_str.strip()
    
    # Handle formats like "8:00 am" or "8:00"
    if 'am' in time_str.lower():
        time_str = time_str.lower().replace('am', '').strip()
        hour, minute = time_str.split(':')
        hour = int(hour)
        if hour == 12:
            hour = 0
        return f"{hour:02d}:{minute}"
    elif 'pm' in time_str.lower():
        time_str = time_str.lower().replace('pm', '').strip()
        hour, minute = time_str.split(':')
        hour = int(hour)
        if hour != 12:
            hour += 12
        return f"{hour:02d}:{minute}"
    else:
        # Assume it's already in 24h format or needs no conversion
        return time_str

def parse_coordinates(coord_str):
    """Parse coordinates string into lat/lng"""
    if not coord_str or coord_str.strip() == '':
        return None
    
    parts = coord_str.strip().split(',')
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lng = float(parts[1].strip())
            return {"latitude": lat, "longitude": lng}
        except:
            return None
    return None

def generate_id(name, address):
    """Generate a unique ID from name and address"""
    # Simple ID generation - lowercase, remove spaces and special chars
    base = name.lower().replace(' ', '-').replace("'", '')
    base = ''.join(c for c in base if c.isalnum() or c == '-')
    return base

# Read CSV and convert
locations = []

with open('campus_locations_source.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        # Skip empty rows
        if not row['Name'] or row['Name'].strip() == '':
            continue
        
        activity = row['Activity'].strip()
        name = row['Name'].strip()
        address = row['Address'].strip()
        
        # Determine type
        type_map = {
            'Food': 'dining',
            'Exercise': 'gym',
            'Study': 'library'
        }
        location_type = type_map.get(activity, 'other')
        
        # Parse hours
        hours = {
            'monday': parse_hours(row['Mon hrs']),
            'tuesday': parse_hours(row['Tue hrs']),
            'wednesday': parse_hours(row['Wed hrs']),
            'thursday': parse_hours(row['Thu hrs']),
            'friday': parse_hours(row['Fri hrs']),
            'saturday': None,  # Not in CSV
            'sunday': None     # Not in CSV
        }
        
        # Parse coordinates
        coordinates = parse_coordinates(row['Coordinates'])
        
        if coordinates:  # Only include locations with valid coordinates
            location = {
                'id': generate_id(name, address),
                'name': name,
                'type': location_type,
                'address': address,
                'coordinates': coordinates,
                'hours': hours
            }
            
            locations.append(location)

# Write JSON
output = {
    'locations': locations,
    'last_updated': '2025-11-21',
    'source': 'Texas A&M University official data'
}

with open('campus_locations.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✓ Converted {len(locations)} locations to JSON")
print(f"  - {len([l for l in locations if l['type'] == 'gym'])} gyms")
print(f"  - {len([l for l in locations if l['type'] == 'dining'])} dining locations")
print(f"  - {len([l for l in locations if l['type'] == 'library'])} study locations")

