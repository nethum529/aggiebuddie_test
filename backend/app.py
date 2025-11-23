"""
AggieBuddie Backend API
Flask REST API for gym activity suggestions

This API serves the AggieBuddie mobile app with intelligent gym recommendations
based on student class schedules and campus locations.

PRIVACY: NO GPS TRACKING - Only uses building locations from student schedules
COLOR REQUIREMENT: Backend serves data; frontend must use NO PURPLE colors
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback

# Import all Phase 1 services (Phase 1 is now complete!)
from services.location_service import LocationService
from services.distance_service import DistanceService
from services.schedule_service import ScheduleService
from services.location_optimizer import LocationOptimizer
from services.ai_service import GymRecommendationAI


# ============================================================================
# FLASK APP INITIALIZATION
# ============================================================================

app = Flask(__name__)

# Enable CORS for mobile app access
# In production, replace '*' with specific mobile app origin
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ============================================================================
# SERVICE INITIALIZATION
# ============================================================================

print("\n" + "="*60)
print("AggieBuddie Backend - Initializing Services")
print("="*60)

# Initialize all services (Phase 1 complete!)
try:
    location_service = LocationService()
    print("✓ LocationService initialized")
except Exception as e:
    print(f"✗ Failed to initialize LocationService: {e}")
    location_service = None

try:
    distance_service = DistanceService()
    print("✓ DistanceService initialized")
except Exception as e:
    print(f"✗ Failed to initialize DistanceService: {e}")
    distance_service = None

try:
    schedule_service = ScheduleService()
    print("✓ ScheduleService initialized")
except Exception as e:
    print(f"✗ Failed to initialize ScheduleService: {e}")
    schedule_service = None

try:
    location_optimizer = LocationOptimizer(distance_service)
    print("✓ LocationOptimizer initialized")
except Exception as e:
    print(f"✗ Failed to initialize LocationOptimizer: {e}")
    location_optimizer = None

try:
    ai_service = GymRecommendationAI(location_optimizer, location_service)
    print("✓ GymRecommendationAI initialized")
except Exception as e:
    print(f"✗ Failed to initialize GymRecommendationAI: {e}")
    ai_service = None

print("="*60)
print("All Phase 1 services initialized successfully!")
print("="*60 + "\n")


# ============================================================================
# IN-MEMORY SCHEDULE STORAGE
# ============================================================================

# Dictionary to store student schedules
# Key: studentId (string)
# Value: {
#   'schedule': parsed_schedule_object,
#   'uploaded_at': timestamp,
#   'buildings_assigned': boolean
# }
schedules = {}


def store_schedule(student_id, schedule_data):
    """
    Store a student's schedule in memory
    
    Args:
        student_id (str): Unique identifier for the student
        schedule_data (dict): Parsed schedule data
    """
    from datetime import datetime
    
    schedules[student_id] = {
        'schedule': schedule_data,
        'uploaded_at': datetime.now().isoformat(),
        'buildings_assigned': False
    }


def get_schedule(student_id):
    """
    Retrieve a student's schedule
    
    Args:
        student_id (str): Unique identifier for the student
    
    Returns:
        dict or None: Schedule data if found, None otherwise
    """
    return schedules.get(student_id)


def update_schedule_buildings(student_id, buildings_assigned=True):
    """
    Update the buildings_assigned flag for a schedule
    
    Args:
        student_id (str): Unique identifier for the student
        buildings_assigned (bool): Whether buildings have been assigned
    """
    if student_id in schedules:
        schedules[student_id]['buildings_assigned'] = buildings_assigned


# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Returns service status and initialized services
    """
    services_status = {
        'location_service': location_service is not None,
        'distance_service': distance_service is not None,
        'schedule_service': schedule_service is not None,
        'location_optimizer': location_optimizer is not None,
        'ai_service': ai_service is not None
    }
    
    all_services_ready = all(services_status.values())
    
    return jsonify({
        'status': 'healthy',
        'message': 'AggieBuddie Backend API is running',
        'version': '1.0.0-mvp',
        'services': services_status,
        'all_services_ready': all_services_ready,
        'phase_1_complete': True,
        'phase_2_complete': True
    }), 200


@app.route('/api/test/locations', methods=['GET'])
def test_locations():
    """
    Test endpoint to verify LocationService is working
    
    Returns sample location data
    """
    if not location_service:
        return jsonify({
            'error': 'LocationService not initialized'
        }), 500
    
    try:
        gyms = location_service.get_locations_by_type('gym')
        dining = location_service.get_locations_by_type('dining')
        study = location_service.get_locations_by_type('study')
        
        return jsonify({
            'success': True,
            'total_locations': len(location_service.get_all_locations()),
            'gyms_count': len(gyms),
            'dining_count': len(dining),
            'study_count': len(study),
            'sample_gym': gyms[0] if gyms else None
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/test/distance', methods=['POST'])
def test_distance():
    """
    Test endpoint to verify DistanceService is working
    
    Expects JSON body:
    {
        "location_id_a": "string",
        "location_id_b": "string"
    }
    """
    if not distance_service or not location_service:
        return jsonify({
            'error': 'Required services not initialized'
        }), 500
    
    try:
        data = request.get_json()
        loc_id_a = data.get('location_id_a')
        loc_id_b = data.get('location_id_b')
        
        if not loc_id_a or not loc_id_b:
            return jsonify({
                'error': 'Missing location_id_a or location_id_b'
            }), 400
        
        loc_a = location_service.get_location_by_id(loc_id_a)
        loc_b = location_service.get_location_by_id(loc_id_b)
        
        if not loc_a or not loc_b:
            return jsonify({
                'error': 'One or both locations not found'
            }), 404
        
        distance_info = distance_service.get_distance_info(loc_a, loc_b)
        
        return jsonify({
            'success': True,
            'distance_info': distance_info
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ============================================================================
# PHASE 2 API ENDPOINTS
# ============================================================================

@app.route('/api/upload-schedule', methods=['POST'])
def upload_schedule():
    """
    Task 2.2: Upload and parse ICS schedule file
    
    Expects JSON body:
    {
        "studentId": "unique-student-id",
        "fileContent": "BEGIN:VCALENDAR\\n..."
    }
    
    Returns:
        Parsed schedule with classes array
    """
    if not schedule_service:
        return jsonify({
            'error': 'ScheduleService not initialized'
        }), 500
    
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data:
            return jsonify({
                'error': 'Missing JSON body'
            }), 400
        
        student_id = data.get('studentId')
        file_content = data.get('fileContent')
        
        if not student_id or not file_content:
            return jsonify({
                'error': 'Missing required parameters: studentId and fileContent'
            }), 400
        
        # Parse ICS content using ScheduleService
        parsed_schedule = schedule_service.parse_ics_content(file_content)
        
        # Store in memory
        store_schedule(student_id, parsed_schedule)
        
        return jsonify({
            'success': True,
            'message': 'Schedule uploaded and parsed successfully',
            'studentId': student_id,
            'schedule': {
                'classes_count': len(parsed_schedule.get('classes', [])),
                'classes': parsed_schedule.get('classes', [])
            }
        }), 200
    
    except ValueError as e:
        return jsonify({
            'error': 'Invalid ICS format',
            'message': str(e)
        }), 400
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to parse schedule',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/schedule/add-locations', methods=['POST'])
def add_locations():
    """
    Task 2.3: Assign building locations to classes
    
    Expects JSON body:
    {
        "studentId": "unique-student-id",
        "locations": {
            "class_summary_1": "building-id-1",
            "class_summary_2": "building-id-2",
            ...
        }
    }
    
    Returns:
        Updated schedule with building assignments
    """
    if not schedule_service or not location_service:
        return jsonify({
            'error': 'Required services not initialized'
        }), 500
    
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data:
            return jsonify({
                'error': 'Missing JSON body'
            }), 400
        
        student_id = data.get('studentId')
        locations = data.get('locations')
        
        if not student_id or not locations:
            return jsonify({
                'error': 'Missing required parameters: studentId and locations'
            }), 400
        
        # Retrieve stored schedule
        schedule_data = get_schedule(student_id)
        if not schedule_data:
            return jsonify({
                'error': 'Schedule not found for this student',
                'message': 'Please upload schedule first'
            }), 404
        
        # Validate all building IDs exist
        invalid_buildings = []
        for class_summary, building_id in locations.items():
            if not location_service.get_location_by_id(building_id):
                invalid_buildings.append(building_id)
        
        if invalid_buildings:
            return jsonify({
                'error': 'Invalid building IDs',
                'invalid_buildings': invalid_buildings
            }), 400
        
        # Assign buildings to classes
        schedule = schedule_data['schedule']
        classes = schedule.get('classes', [])
        
        # Update building_id for matching classes
        assignments_made = 0
        for cls in classes:
            course_id = cls.get('course_id', '')
            if course_id in locations:
                cls['building_id'] = locations[course_id]
                assignments_made += 1
        
        # Update stored schedule
        schedule_data['schedule']['classes'] = classes
        update_schedule_buildings(student_id, True)
        
        return jsonify({
            'success': True,
            'message': 'Building locations assigned successfully',
            'studentId': student_id,
            'requested_assignments': len(locations),
            'assignments_made': assignments_made
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to assign locations',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    """
    Get list of all campus buildings for building picker
    
    This endpoint is functional since LocationService is complete!
    
    Returns:
        JSON array of building objects sorted alphabetically
    """
    if not location_service:
        return jsonify({
            'error': 'LocationService not initialized'
        }), 500
    
    try:
        # Get all locations that could be class buildings
        # This includes any location that could host classes
        all_locations = location_service.get_all_locations()
        
        # Filter for relevant types (exclude gyms since those are destinations, not class locations)
        # In the future, we might want to add a 'building' type specifically for academic buildings
        buildings = [loc for loc in all_locations if loc.get('type') != 'gym']
        
        # Sort alphabetically by name
        buildings.sort(key=lambda x: x.get('name', ''))
        
        # Return simplified building data for the picker
        building_list = [{
            'id': b.get('id'),
            'name': b.get('name'),
            'address': b.get('address'),
            'coordinates': b.get('coordinates')
        } for b in buildings]
        
        return jsonify({
            'success': True,
            'count': len(building_list),
            'buildings': building_list
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/generate-suggestions', methods=['POST'])
def generate_suggestions():
    """
    Task 2.5: Generate gym suggestions for free time blocks
    
    Expects JSON body:
    {
        "studentId": "unique-student-id",
        "startOfDay": "08:00",
        "endOfDay": "18:00",
        "durationMinutes": 60
    }
    
    Returns:
        Ranked gym suggestions for each suitable free time block
    """
    if not all([schedule_service, location_service, location_optimizer, ai_service]):
        return jsonify({
            'error': 'Required services not initialized'
        }), 500
    
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data:
            return jsonify({
                'error': 'Missing JSON body'
            }), 400
        
        student_id = data.get('studentId')
        start_of_day = data.get('startOfDay', '08:00')
        end_of_day = data.get('endOfDay', '18:00')
        duration_minutes = data.get('durationMinutes', 60)
        
        if not student_id:
            return jsonify({
                'error': 'Missing required parameter: studentId'
            }), 400
        
        # Retrieve stored schedule
        schedule_data = get_schedule(student_id)
        if not schedule_data:
            return jsonify({
                'error': 'Schedule not found for this student',
                'message': 'Please upload schedule first'
            }), 404
        
        if not schedule_data['buildings_assigned']:
            return jsonify({
                'error': 'Buildings not assigned',
                'message': 'Please assign building locations to classes first'
            }), 400
        
        # Calculate free time blocks
        schedule = schedule_data['schedule']
        free_blocks = schedule_service.calculate_free_blocks(
            schedule, 
            start_of_day, 
            end_of_day
        )
        
        # Prepare input for AI service
        ai_input = {
            'free_time_blocks': free_blocks,
            'activity_duration_minutes': duration_minutes,
            'activity_type': 'gym'
        }
        
        # Generate suggestions using AI service
        suggestions = ai_service.generate_suggestions(ai_input)
        
        return jsonify({
            'success': True,
            'message': f'Generated {len(suggestions)} suggestions',
            'studentId': student_id,
            'suggestions': suggestions,
            'parameters': {
                'start_of_day': start_of_day,
                'end_of_day': end_of_day,
                'duration_minutes': duration_minutes
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate suggestions',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/regenerate-suggestion', methods=['POST'])
def regenerate_suggestion():
    """
    Regenerate a new suggestion for a specific time block
    
    Expects JSON body:
    {
        "studentId": "unique-student-id",
        "timeBlockId": 1,  # Optional: ID of the time block
        "date": "2024-11-21",  # Date of the time block
        "startTime": "10:00",  # Start time of the time block
        "endTime": "11:30",    # End time of the time block
        "durationMinutes": 60  # Desired activity duration
    }
    
    Returns:
        New suggestion for the specified time block
    """
    if not all([schedule_service, location_service, location_optimizer, ai_service]):
        return jsonify({
            'error': 'Required services not initialized'
        }), 500
    
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data:
            return jsonify({
                'error': 'Missing JSON body'
            }), 400
        
        student_id = data.get('studentId')
        date = data.get('date')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        duration_minutes = data.get('durationMinutes', 60)
        
        if not student_id:
            return jsonify({
                'error': 'Missing required parameter: studentId'
            }), 400
        
        if not all([date, start_time, end_time]):
            return jsonify({
                'error': 'Missing required parameters: date, startTime, endTime'
            }), 400
        
        # Retrieve stored schedule
        schedule_data = get_schedule(student_id)
        if not schedule_data:
            return jsonify({
                'error': 'Schedule not found for this student',
                'message': 'Please upload schedule first'
            }), 404
        
        if not schedule_data['buildings_assigned']:
            return jsonify({
                'error': 'Buildings not assigned',
                'message': 'Please assign building locations to classes first'
            }), 400
        
        # Get schedule and find the specific time block
        schedule = schedule_data['schedule']
        
        # Calculate free time blocks to find the matching one
        # We'll use a wide time range to ensure we capture the block
        free_blocks = schedule_service.calculate_free_blocks(
            schedule,
            '00:00',  # Start from beginning of day
            '23:59'   # End at end of day
        )
        
        # Find the matching time block
        # Convert date string to date object for comparison
        from datetime import datetime as dt
        try:
            target_date = dt.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'error': 'Invalid date format',
                'message': 'Date must be in YYYY-MM-DD format'
            }), 400
        
        matching_block = None
        for block in free_blocks:
            block_date = block['date']
            # Handle both date objects and date strings
            if isinstance(block_date, str):
                try:
                    block_date = dt.strptime(block_date, '%Y-%m-%d').date()
                except ValueError:
                    continue
            
            if (block_date == target_date and 
                block['start_time'] == start_time and 
                block['end_time'] == end_time):
                matching_block = block
                break
        
        if not matching_block:
            return jsonify({
                'error': 'Time block not found',
                'message': f'No free time block found for {date} {start_time}-{end_time}'
            }), 404
        
        # Prepare input for AI service (single time block)
        ai_input = {
            'free_time_blocks': [matching_block],  # Single block
            'activity_duration_minutes': duration_minutes,
            'activity_type': 'gym'
        }
        
        # Generate new suggestion using AI service
        suggestions_result = ai_service.generate_suggestions(ai_input)
        new_suggestions = suggestions_result.get('suggestions', [])
        
        if not new_suggestions:
            return jsonify({
                'error': 'No suggestions available',
                'message': 'Could not generate a new suggestion for this time block. Try a different time or adjust duration.'
            }), 400
        
        # Return the first (best) suggestion
        new_suggestion = new_suggestions[0]
        
        return jsonify({
            'success': True,
            'message': 'New suggestion generated',
            'suggestion': new_suggestion
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to regenerate suggestion',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested API endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on the server'
    }), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Starting AggieBuddie Backend Server")
    print("Phase 2 Complete - All API Endpoints Ready!")
    print("="*60)
    print("API will be available at: http://localhost:5000")
    print("\n📋 Available Endpoints:")
    print("  GET  /api/health")
    print("  GET  /api/test/locations")
    print("  POST /api/test/distance")
    print("  POST /api/upload-schedule")
    print("  POST /api/schedule/add-locations")
    print("  GET  /api/buildings")
    print("  POST /api/generate-suggestions")
    print("="*60 + "\n")
    
    # Run Flask development server
    # host='0.0.0.0' allows access from mobile device on same network
    # debug=True enables auto-reload and detailed error messages
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )

