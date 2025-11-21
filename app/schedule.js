/**
 * Schedule Screen - Displays student schedule with calendar view
 * 
 * Features:
 * - Daily/3-Day/Monthly view toggle
 * - Time-based event rendering (7am-4pm)
 * - Current time indicator
 * - Event cards with location and time
 * - Week navigation
 * 
 * State:
 * - viewMode: Current view type (Daily/3-Day/Monthly)
 * - selectedDate: Currently displayed date
 * - currentTime: Current time for "now" indicator
 * 
 * Hardcoded Data:
 * - scheduleEvents: Mock event data (TODO: Replace with real schedule from backend)
 * 
 * Future Enhancements:
 * - Load schedule from backend API
 * - Display suggestion overlays (transparent blue)
 * - Accept/reject suggestion workflow
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const VIEW_OPTIONS = ['Daily', '3-Day', 'Monthly'];
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 16;
const HOUR_HEIGHT = 80;
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) => DAY_START_HOUR + index);
const TIMELINE_HEIGHT = (HOURS.length - 1) * HOUR_HEIGHT;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

const scheduleEvents = [
  {
    id: 'gym',
    title: 'Gym',
    start: '07:00',
    end: '07:45',
    location: 'Polo Gym',
    color: '#F7A4A4',
    weekday: 1,
  },
  {
    id: 'math',
    title: 'MATH 304',
    start: '08:00',
    end: '08:50',
    location: 'BLOC 102',
    color: '#BDEAB5',
    weekday: 1,
  },
  {
    id: 'csce',
    title: 'CSCE 221',
    start: '10:20',
    end: '11:10',
    location: 'ZACH 350',
    color: '#BDEAB5',
    weekday: 1,
  },
  {
    id: 'atmo',
    title: 'ATMO 201',
    start: '12:30',
    end: '13:20',
    location: 'Online',
    color: '#C0F1FF',
    weekday: 1,
  },
  {
    id: 'lunch',
    title: 'Lunch',
    start: '13:00',
    end: '13:45',
    location: 'See Options',
    color: '#F5E8A6',
    weekday: 1,
  },
];

const minutesFromStart = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatClockLabel = (minutes) => {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
};

const formatTimelineLabel = (hour24) => {
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}${suffix}`;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getCurrentWeekMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const offset = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - offset);
  return monday;
};

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState(VIEW_OPTIONS[0]);
  const [selectedDate, setSelectedDate] = useState(getCurrentWeekMonday);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedEvents = useMemo(() => {
    const weekday = selectedDate.getDay();
    return scheduleEvents
      .filter((event) => event.weekday === weekday)
      .sort((a, b) => minutesFromStart(a.start) - minutesFromStart(b.start));
  }, [selectedDate]);

  const nowIndicatorTop = useMemo(() => {
    const startMinutes = DAY_START_HOUR * 60;
    const endMinutes = DAY_END_HOUR * 60;
    const minutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();

    if (!sameDay(currentTime, selectedDate)) return null;
    if (minutesNow < startMinutes || minutesNow > endMinutes) return null;
    return (minutesNow - startMinutes) * PIXELS_PER_MINUTE;
  }, [currentTime, selectedDate]);

  const showNowIndicator = viewMode === 'Daily' && nowIndicatorTop !== null;

  const handleChangeWeek = (direction) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * 7);
      return next;
    });
  };

  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNumber = selectedDate.getDate();
  const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'long' });

  return (
    <View style={styles.container}>
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <View style={styles.viewToggle}>
        {VIEW_OPTIONS.map((option) => {
          const isActive = viewMode === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.viewButton, isActive && styles.viewButtonActive]}
              onPress={() => setViewMode(option)}
            >
              <Text style={[styles.viewButtonText, isActive && styles.viewButtonTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scheduleCard}>
          <View style={styles.dayColumn}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayText}>{dayLabel}</Text>
              <Text style={styles.dateText}>{dateNumber}</Text>
            </View>

            <View style={styles.times}>
              {HOURS.slice(0, -1).map((hour) => (
                <View key={hour} style={styles.timeSlot}>
                  <Text style={styles.timeLabel}>{formatTimelineLabel(hour)}</Text>
                </View>
              ))}
              <Text style={[styles.timeLabel, styles.lastTimeLabel]}>{formatTimelineLabel(HOURS[HOURS.length - 1])}</Text>
            </View>
          </View>

          <View style={styles.timelineColumn}>
            <View style={styles.monthHeader}>
              <TouchableOpacity style={styles.monthButton} onPress={() => handleChangeWeek(-1)}>
                <Feather name="chevron-left" size={20} color="#333" />
              </TouchableOpacity>

              <View>
                <Text style={styles.monthText}>{monthLabel}</Text>
                <Text style={styles.weekLabel}>
                  Week of {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <TouchableOpacity style={styles.monthButton} onPress={() => handleChangeWeek(1)}>
                <Feather name="chevron-right" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {viewMode === 'Daily' ? (
              <View style={styles.timelineBody}>
                <View style={styles.hourLines}>
                  {HOURS.slice(0, -1).map((hour) => (
                    <View key={`line-${hour}`} style={styles.hourBlock} />
                  ))}
                </View>

                <View style={styles.eventsLayer}>
                  {showNowIndicator && (
                    <View style={[styles.nowIndicator, { top: nowIndicatorTop }]}>
                      <Text style={styles.nowLabel}>{formatClockLabel(currentTime.getHours() * 60 + currentTime.getMinutes())}</Text>
                      <View style={styles.nowLine} />
                    </View>
                  )}

                  {selectedEvents.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No events for this day.</Text>
                    </View>
                  )}

                  {selectedEvents.map((event) => {
                    const startMinutes = minutesFromStart(event.start);
                    const endMinutes = minutesFromStart(event.end);
                    const offsetTop = (startMinutes - DAY_START_HOUR * 60) * PIXELS_PER_MINUTE;
                    const duration = endMinutes - startMinutes;
                    const height = Math.max(duration * PIXELS_PER_MINUTE - 8, 52);

                    return (
                      <View key={event.id} style={[styles.eventCard, { top: offsetTop, height, backgroundColor: event.color }]}>
                        <View style={styles.eventHeader}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Feather name="edit-2" size={16} color="#333" />
                        </View>
                        <Text style={styles.eventTime}>
                          {formatClockLabel(startMinutes)} - {formatClockLabel(endMinutes)}
                        </Text>
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color="#333" style={styles.locationIcon} />
                          <Text style={styles.locationText}>{event.location}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>The {viewMode} view is coming soon.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 6,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: Colors.accentLight,
  },
  viewButtonText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  viewButtonTextActive: {
    color: Colors.text.light,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    flexGrow: 1,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    padding: 16,
    gap: 12,
    minHeight: 580,
  },
  dayColumn: {
    width: 96,
    alignItems: 'center',
  },
  dayBadge: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.light,
  },
  dateText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.light,
  },
  times: {
    width: '100%',
    position: 'relative',
    height: TIMELINE_HEIGHT,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.text.dark,
  },
  lastTimeLabel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    textAlign: 'center',
  },
  timelineColumn: {
    flex: 1,
    backgroundColor: Colors.surfaceBlue,
    borderRadius: 20,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.dark,
    textAlign: 'center',
  },
  weekLabel: {
    textAlign: 'center',
    color: '#6c7a99',
    marginTop: 2,
    fontSize: 13,
  },
  timelineBody: {
    marginTop: 16,
    height: TIMELINE_HEIGHT,
    position: 'relative',
  },
  hourLines: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    zIndex: 1,
  },
  hourBlock: {
    height: HOUR_HEIGHT,
    borderBottomColor: '#d2daeb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventsLayer: {
    flex: 1,
    height: TIMELINE_HEIGHT,
    position: 'relative',
    paddingHorizontal: 8,
    paddingTop: 4,
    zIndex: 2,
  },
  nowIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  nowLabel: {
    color: '#c44',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  nowLine: {
    height: 2,
    backgroundColor: '#c44',
    flex: 1,
    borderRadius: 2,
  },
  eventCard: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  eventTime: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#333',
  },
  emptyState: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyStateText: {
    color: Colors.text.secondary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
