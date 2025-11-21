"""
Schedule Service - Handles ICS file parsing and free time block calculation

Parses ICS (iCalendar) files and identifies free time blocks between classes.
Based on existing free_time_blocks_update.py but adapted for API use.
"""

from icalendar import Calendar
from datetime import datetime, time
from dateutil.rrule import rrulestr
import re


class ScheduleService:
    """Service for processing student schedules and finding free time"""
    
    def __init__(self):
        """Initialize the schedule service"""
        pass
    
    def parse_ics_content(self, ics_string):
        """
        Parse ICS file content into structured schedule
        
        Args:
            ics_string (str): Content of .ics file
        
        Returns:
            dict: {
                'classes': [
                    {
                        'course_id': str,
                        'start': datetime,
                        'end': datetime,
                        'location': str,
                        'description': str,
                        'uid': str,
                        'building_id': None  # To be assigned later
                    },
                    ...
                ]
            }
        
        Raises:
            ValueError: If ICS content is invalid
        """
        try:
            cal = Calendar.from_ical(ics_string)
        except Exception as e:
            raise ValueError(f"Invalid ICS file format: {e}")
        
        classes = []
        
        for component in cal.walk():
            if component.name == "VEVENT":
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                
                if dtstart and dtend:
                    start_dt = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
                    end_dt = dtend.dt if hasattr(dtend, 'dt') else dtend
                    
                    # Handle recurring events
                    rrule = component.get('rrule')
                    if rrule:
                        # Expand recurring events
                        recurring_events = self._parse_recurring_events(
                            component, start_dt, end_dt
                        )
                        classes.extend(recurring_events)
                    else:
                        # Single event
                        event = {
                            'course_id': str(component.get('summary', '')),
                            'start': start_dt,
                            'end': end_dt,
                            'location': str(component.get('location', '')),
                            'description': str(component.get('description', '')),
                            'uid': str(component.get('uid', '')),
                            'building_id': None  # Will be assigned later
                        }
                        classes.append(event)
        
        return {'classes': classes}
    
    def _parse_recurring_events(self, component, start_dt, end_dt):
        """
        Expand recurring events into individual occurrences
        
        Args:
            component: iCalendar event component
            start_dt: Start datetime of first occurrence
            end_dt: End datetime of first occurrence
        
        Returns:
            list: List of individual event occurrences
        """
        events = []
        duration = end_dt - start_dt
        
        # Convert timezone-aware datetime to naive for rrule parsing
        if hasattr(start_dt, 'tzinfo') and start_dt.tzinfo is not None:
            original_tz = start_dt.tzinfo
            start_dt_naive = start_dt.replace(tzinfo=None)
        else:
            original_tz = None
            start_dt_naive = start_dt
        
        # Get rrule string
        rrule = component.get('rrule')
        rrule_str = f"DTSTART:{start_dt_naive.strftime('%Y%m%dT%H%M%S')}\n"
        rrule_str += f"RRULE:{rrule.to_ical().decode('utf-8')}"
        
        # Parse the recurrence rule
        try:
            rrule_obj = rrulestr(rrule_str, dtstart=start_dt_naive, ignoretz=True)
        except ValueError:
            # Handle timezone issues
            rrule_str_modified = re.sub(r'UNTIL=\d{8}T\d{6}Z', 
                                         lambda m: m.group(0).replace('Z', ''), 
                                         rrule_str)
            rrule_obj = rrulestr(rrule_str_modified, dtstart=start_dt_naive)
        
        # Generate all occurrences
        for occurrence_start in rrule_obj:
            if original_tz:
                occurrence_start = occurrence_start.replace(tzinfo=original_tz)
            
            occurrence_end = occurrence_start + duration
            
            event = {
                'course_id': str(component.get('summary', '')),
                'start': occurrence_start,
                'end': occurrence_end,
                'location': str(component.get('location', '')),
                'description': str(component.get('description', '')),
                'uid': str(component.get('uid', '')),
                'building_id': None
            }
            events.append(event)
        
        return events
    
    def calculate_free_blocks(self, schedule, start_of_day='08:00', end_of_day='18:00'):
        """
        Calculate free time blocks between classes
        
        Args:
            schedule (dict): Parsed schedule with 'classes' array
            start_of_day (str): Start time in HH:MM format
            end_of_day (str): End time in HH:MM format
        
        Returns:
            list: [
                {
                    'date': date object,
                    'start_time': 'HH:MM',
                    'end_time': 'HH:MM',
                    'previous_class_location': str (building_id),
                    'next_class_location': str (building_id),
                    'available_minutes': int
                },
                ...
            ]
        """
        classes = schedule.get('classes', [])
        
        # Group classes by date
        classes_by_date = {}
        for cls in classes:
            if isinstance(cls['start'], datetime):
                date = cls['start'].date()
                if date not in classes_by_date:
                    classes_by_date[date] = []
                classes_by_date[date].append(cls)
        
        free_blocks = []
        
        # Parse day boundaries
        start_hour, start_min = map(int, start_of_day.split(':'))
        end_hour, end_min = map(int, end_of_day.split(':'))
        
        for date, day_classes in classes_by_date.items():
            # Sort classes by start time
            day_classes.sort(key=lambda x: x['start'])
            
            # Find gaps between consecutive classes
            for i in range(len(day_classes) - 1):
                current = day_classes[i]
                next_cls = day_classes[i + 1]
                
                gap_start = current['end']
                gap_end = next_cls['start']
                
                # Only include if there's actually a gap
                if gap_start < gap_end:
                    minutes = int((gap_end - gap_start).total_seconds() / 60)
                    
                    free_block = {
                        'date': date,
                        'start_time': gap_start.strftime('%H:%M'),
                        'end_time': gap_end.strftime('%H:%M'),
                        'previous_class_location': current.get('building_id', 'Unknown'),
                        'next_class_location': next_cls.get('building_id', 'Unknown'),
                        'available_minutes': minutes,
                        'previous_class_name': current.get('course_id', 'Unknown'),
                        'next_class_name': next_cls.get('course_id', 'Unknown')
                    }
                    free_blocks.append(free_block)
        
        return free_blocks
    
    def assign_building_to_class(self, schedule, course_id, building_id):
        """
        Assign a building ID to all instances of a class
        
        Args:
            schedule (dict): Schedule object with 'classes'
            course_id (str): Course identifier (e.g., "CSCE 221")
            building_id (str): Building location ID
        
        Returns:
            int: Number of classes updated
        """
        updated_count = 0
        for cls in schedule.get('classes', []):
            if cls['course_id'] == course_id:
                cls['building_id'] = building_id
                updated_count += 1
        
        return updated_count
    
    def get_schedule_summary(self, schedule):
        """
        Get a summary of the schedule
        
        Args:
            schedule (dict): Parsed schedule
        
        Returns:
            dict: Summary information
        """
        classes = schedule.get('classes', [])
        
        # Get unique courses
        unique_courses = set(cls['course_id'] for cls in classes)
        
        # Get date range
        if classes:
            dates = [cls['start'].date() for cls in classes if isinstance(cls['start'], datetime)]
            start_date = min(dates) if dates else None
            end_date = max(dates) if dates else None
        else:
            start_date = None
            end_date = None
        
        return {
            'total_classes': len(classes),
            'unique_courses': len(unique_courses),
            'courses': list(unique_courses),
            'start_date': start_date,
            'end_date': end_date
        }

