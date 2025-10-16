import pandas as pd
from icalendar import Calendar
from datetime import datetime, timedelta
from dateutil.rrule import rrulestr
import pytz

def parse_recurring_events(component, start_dt, end_dt, rrule_str):
    """
    Expand recurring events into individual occurrences
    
    Args:
        component: iCalendar event component
        start_dt: Start datetime of the first occurrence
        end_dt: End datetime of the first occurrence
        rrule_str: Recurrence rule string
    
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
    
    # Parse the recurrence rule with naive datetime
    try:
        rrule = rrulestr(rrule_str, dtstart=start_dt_naive, ignoretz=True)
    except ValueError:
        import re
        rrule_str_modified = re.sub(r'UNTIL=\d{8}T\d{6}Z', 
                                     lambda m: m.group(0).replace('Z', ''), 
                                     rrule_str)
        rrule = rrulestr(rrule_str_modified, dtstart=start_dt_naive)
    
    # Generate all occurrences
    for occurrence_start in rrule:
        if original_tz:
            occurrence_start = occurrence_start.replace(tzinfo=original_tz)
            occurrence_end = occurrence_start + duration
        else:
            occurrence_end = occurrence_start + duration
            
        event = {
            'course_id': str(component.get('summary', '')),
            'start': occurrence_start,
            'end': occurrence_end,
            'description': str(component.get('description', '')),
            'location': str(component.get('location', '')),
            'status': str(component.get('status', '')),
            'uid': str(component.get('uid', ''))
        }
        events.append(event)
    
    return events

def ics_to_dataframe(ics_file_path, expand_recurring=True, classes_filter=None):
    """
    Convert .ics calendar file to pandas DataFrame
    
    Args:
        ics_file_path (str): Path to the .ics file
        expand_recurring (bool): If True, expands recurring events into individual rows
        classes_filter (list): Optional list of class names to include (e.g., ['ISTM-622-601', 'ISTM-624-601'])
                              If None, includes all classes
    
    Returns:
        pd.DataFrame: DataFrame containing calendar events
    """
    # Read and parse the .ics file
    with open(ics_file_path, 'rb') as file:
        calendar = Calendar.from_ical(file.read())
    
    events = []
    
    # Process each event
    for component in calendar.walk():
        if component.name == "VEVENT":
            dtstart = component.get('dtstart')
            dtend = component.get('dtend')
            
            if dtstart and dtend:
                start_dt = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
                end_dt = dtend.dt if hasattr(dtend, 'dt') else dtend
                course_id = str(component.get('summary', ''))
                
                # Apply filter if specified
                if classes_filter and course_id not in classes_filter:
                    continue
                
                rrule = component.get('rrule')
                
                if rrule and expand_recurring:
                    rrule_str = f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}\n"
                    rrule_str += f"RRULE:{rrule.to_ical().decode('utf-8')}"
                    
                    recurring_events = parse_recurring_events(
                        component, start_dt, end_dt, rrule_str
                    )
                    events.extend(recurring_events)
                else:
                    event = {
                        'course_id': course_id,
                        'start': start_dt,
                        'end': end_dt,
                        'description': str(component.get('description', '')),
                        'location': str(component.get('location', '')),
                        'status': str(component.get('status', '')),
                        'uid': str(component.get('uid', ''))
                    }
                    events.append(event)
    
    # Create DataFrame
    df = pd.DataFrame(events)
    
    if not df.empty and 'start' in df.columns:
        df = df.sort_values('start').reset_index(drop=True)
        
        # Add helpful columns
        df['day_of_week'] = df['start'].apply(
            lambda x: x.strftime('%A') if isinstance(x, datetime) else ''
        )
        df['date'] = df['start'].apply(
            lambda x: x.date() if isinstance(x, datetime) else ''
        )
        df['start_time'] = df['start'].apply(
            lambda x: x.strftime('%I:%M %p') if isinstance(x, datetime) else ''
        )
        df['end_time'] = df['end'].apply(
            lambda x: x.strftime('%I:%M %p') if isinstance(x, datetime) else ''
        )
        
        # Add total_classes column - shows total count for each course
        class_counts = df['course_id'].value_counts().to_dict()
        df['total_classes'] = df['course_id'].map(class_counts)
    
    # Reorder columns for readability
    column_order = ['course_id', 'total_classes', 'date', 'day_of_week', 'start_time', 
                    'end_time', 'location', 'description', 'status', 'start', 'end', 'uid']
    df = df[[col for col in column_order if col in df.columns]]
    
    return df

def ics_to_csv(ics_file_path, csv_output_path, expand_recurring=True, classes_filter=None):
    """
    Convert .ics calendar file to CSV
    
    Args:
        ics_file_path (str): Path to the .ics file
        csv_output_path (str): Output CSV file path
        expand_recurring (bool): If True, expands recurring events
        classes_filter (list): Optional list of class names to include
    
    Returns:
        pd.DataFrame: The created DataFrame
    """
    df = ics_to_dataframe(ics_file_path, expand_recurring, classes_filter)
    df.to_csv(csv_output_path, index=False, encoding='utf-8', sep='|')
    return df

# Example usage with your TAMU schedule
if __name__ == "__main__":
    from datetime import datetime as dt_now
    
    ics_file = r"C:\Users\mekal\OneDrive\Desktop\schedule.ics"
    
    # Generate filename with timestamp
    timestamp = dt_now.now().strftime("%Y%m%d_%H%M%S")
    csv_file = rf"C:\Users\mekal\Downloads\tamu_schedule_{timestamp}.csv"
    
    # OPTIONAL: Filter specific classes (uncomment and modify if needed)
    # classes_to_include = ['ISTM-622-601', 'ISTM-624-601']  # Add your class codes here
    # Or set to None to include ALL classes
    classes_to_include = None  # This includes ALL classes
    
    try:
        # Convert to CSV silently
        df = ics_to_csv(ics_file, csv_file, expand_recurring=True, classes_filter=classes_to_include)
        print("✓ Schedule loaded into CSV successfully!")
        
    except FileNotFoundError:
        print(f"Error: Could not find '{ics_file}'")
    except Exception as e:
        print(f"Error: {e}")