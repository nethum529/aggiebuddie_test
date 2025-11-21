"""
Test script for GymRecommendationAI - Complete end-to-end test
"""
from services.location_service import LocationService
from services.distance_service import DistanceService
from services.schedule_service import ScheduleService
from services.location_optimizer import LocationOptimizer
from services.ai_service import GymRecommendationAI

print("=" * 70)
print("Testing Complete AI Pipeline - From Schedule to Suggestions")
print("=" * 70)

# Initialize all services
print("\n1. Initializing services...")
location_service = LocationService()
distance_service = DistanceService()
schedule_service = ScheduleService()
optimizer = LocationOptimizer(distance_service)
ai_service = GymRecommendationAI(optimizer, location_service)
print("   ✓ All services initialized")

# Sample ICS content (a student's schedule)
sample_ics = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART:20251124T080000
DTEND:20251124T085000
SUMMARY:MATH 304
LOCATION:BLOC 102
UID:test1@example.com
END:VEVENT
BEGIN:VEVENT
DTSTART:20251124T102000
DTEND:20251124T111000
SUMMARY:CSCE 221
LOCATION:ZACH 350
UID:test2@example.com
END:VEVENT
BEGIN:VEVENT
DTSTART:20251124T133000
DTEND:20251124T142000
SUMMARY:PHYS 218
LOCATION:MPHY 203
UID:test3@example.com
END:VEVENT
END:VCALENDAR
"""

print("\n2. Parsing student schedule...")
schedule = schedule_service.parse_ics_content(sample_ics)
print(f"   ✓ Found {len(schedule['classes'])} classes")
for cls in schedule['classes']:
    print(f"     - {cls['course_id']}: {cls['start'].strftime('%H:%M')}-{cls['end'].strftime('%H:%M')}")

print("\n3. Assigning building locations...")
# Assign buildings (using available locations as proxies)
schedule_service.assign_building_to_class(schedule, 'MATH 304', 'memorial-student-center-msc')
schedule_service.assign_building_to_class(schedule, 'CSCE 221', 'zachry-engineering-education-complex')
schedule_service.assign_building_to_class(schedule, 'PHYS 218', 'sterling-c-evans-library')
print("   ✓ Buildings assigned to all classes")

print("\n4. Calculating free time blocks...")
free_blocks = schedule_service.calculate_free_blocks(schedule, '08:00', '18:00')
print(f"   ✓ Found {len(free_blocks)} free time blocks:")
for block in free_blocks:
    print(f"     - {block['start_time']}-{block['end_time']}: {block['available_minutes']} minutes")

print("\n5. Generating gym suggestions with AI...")
input_data = {
    'free_time_blocks': free_blocks,
    'activity_duration_minutes': 60,
    'activity_type': 'gym'
}

suggestions_result = ai_service.generate_suggestions(input_data)
suggestions = suggestions_result['suggestions']

print(f"   ✓ Generated {len(suggestions)} suggestions")
print("\n" + "=" * 70)
print("RECOMMENDATIONS FOR STUDENT")
print("=" * 70)

if not suggestions:
    print("\n⚠️  No feasible gym suggestions found.")
    print("   Try: Longer free blocks or shorter workout duration")
else:
    current_block = None
    for suggestion in suggestions:
        # Group by time block
        block_time = f"{suggestion['start_time']}-{suggestion['end_time']}"
        if block_time != current_block:
            current_block = block_time
            print(f"\n📅 Free Time: {suggestion['date']} {block_time}")
            print(f"   ({suggestion['previous_class']} → {suggestion['next_class']})")
            print()
        
        rank_emoji = {1: "🥇", 2: "🥈", 3: "🥉"}.get(suggestion['rank'], "•")
        print(f"  {rank_emoji} Option {suggestion['rank']}: {suggestion['location_name']}")
        print(f"     Activity: {suggestion['activity']} ({suggestion['activity_duration']} min)")
        print(f"     Address: {suggestion['location_address']}")
        print(f"     Confidence: {suggestion['confidence_score']*100:.0f}%")
        print(f"     Commute: {suggestion['commute_info']['time_to']}min there, "
              f"{suggestion['commute_info']['time_from']}min back "
              f"(+{suggestion['commute_info']['spare_time']}min spare)")
        print(f"     Why: {suggestion['reasoning']}")
        print()

# Get summary
print("=" * 70)
print("SUMMARY")
print("=" * 70)
summary = ai_service.get_suggestion_summary(suggestions_result)
print(f"\nTotal suggestions: {summary['total_suggestions']}")
print(f"Days covered: {summary['unique_dates']}")
print(f"Unique gyms: {summary['unique_locations']}")

if summary['top_locations']:
    print(f"\nMost recommended gyms:")
    for loc_id, info in summary['top_locations']:
        print(f"  • {info['name']}: {info['count']} suggestions")

print("\n" + "=" * 70)
print("✓ Complete AI Pipeline Test Successful!")
print("=" * 70)

