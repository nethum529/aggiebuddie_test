/**
 * Schedule Screen - Displays student schedule with daily calendar view
 * 
 * Features:
 * - Daily calendar view
 * - Time-based event rendering (7am-4pm)
 * - Current time indicator
 * - Event cards with location and time
 * - Week navigation
 * - ✅ AI-GENERATED SUGGESTIONS: Transparent blue overlays with accept/reject
 * 
 * State:
 * - selectedDate: Currently displayed date
 * - currentTime: Current time for "now" indicator
 * 
 * Data Sources:
 * - scheduleEvents: Real schedule from UserContext
 * - suggestions: AI-generated gym suggestions from backend
 * - acceptedSuggestions: User-accepted suggestions
 * - rejectedSuggestions: Hidden suggestions
 * 
 * Suggestion Workflow:
 * 1. User generates suggestions in Activity Preferences screen
 * 2. Suggestions appear as transparent blue overlays here
 * 3. User can accept (becomes solid event) or reject (hides it)
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useUser } from '../contexts/UserContext';

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
  
  // TUESDAY (weekday: 2)
  {
    id: 'gym-tue',
    title: 'Gym',
    start: '07:00',
    end: '07:45',
    location: 'Rec Center',
    color: '#F7A4A4',
    weekday: 2,
  },
  {
    id: 'engr-tue',
    title: 'ENGR 102',
    start: '09:35',
    end: '10:50',
    location: 'ZACH 105A',
    color: '#BDEAB5',
    weekday: 2,
  },
  {
    id: 'atmo-tue',
    title: 'ATMO 201',
    start: '12:30',
    end: '13:20',
    location: 'Online',
    color: '#C0F1FF',
    weekday: 2,
  },
  {
    id: 'lunch-tue',
    title: 'Lunch',
    start: '13:00',
    end: '13:45',
    location: 'See Options',
    color: '#F5E8A6',
    weekday: 2,
  },
  
  // WEDNESDAY (weekday: 3) - Same as Monday (M/W/F pattern)
  {
    id: 'gym-wed',
    title: 'Gym',
    start: '07:00',
    end: '07:45',
    location: 'Polo Gym',
    color: '#F7A4A4',
    weekday: 3,
  },
  {
    id: 'math-wed',
    title: 'MATH 304',
    start: '08:00',
    end: '08:50',
    location: 'BLOC 102',
    color: '#BDEAB5',
    weekday: 3,
  },
  {
    id: 'csce-wed',
    title: 'CSCE 221',
    start: '10:20',
    end: '11:10',
    location: 'ZACH 350',
    color: '#BDEAB5',
    weekday: 3,
  },
  {
    id: 'lunch-wed',
    title: 'Lunch',
    start: '13:00',
    end: '13:45',
    location: 'See Options',
    color: '#F5E8A6',
    weekday: 3,
  },
  
  // THURSDAY (weekday: 4) - Same as Tuesday (T/Th pattern)
  {
    id: 'gym-thu',
    title: 'Gym',
    start: '07:00',
    end: '07:45',
    location: 'Rec Center',
    color: '#F7A4A4',
    weekday: 4,
  },
  {
    id: 'engr-thu',
    title: 'ENGR 102',
    start: '09:35',
    end: '10:50',
    location: 'ZACH 105A',
    color: '#BDEAB5',
    weekday: 4,
  },
  {
    id: 'atmo-thu',
    title: 'ATMO 201',
    start: '12:30',
    end: '13:20',
    location: 'Online',
    color: '#C0F1FF',
    weekday: 4,
  },
  {
    id: 'lunch-thu',
    title: 'Lunch',
    start: '13:00',
    end: '13:45',
    location: 'See Options',
    color: '#F5E8A6',
    weekday: 4,
  },
  
  // FRIDAY (weekday: 5) - Same as M/W (M/W/F pattern)
  {
    id: 'gym-fri',
    title: 'Gym',
    start: '07:00',
    end: '07:45',
    location: 'Polo Gym',
    color: '#F7A4A4',
    weekday: 5,
  },
  {
    id: 'math-fri',
    title: 'MATH 304',
    start: '08:00',
    end: '08:50',
    location: 'BLOC 102',
    color: '#BDEAB5',
    weekday: 5,
  },
  {
    id: 'csce-fri',
    title: 'CSCE 221',
    start: '10:20',
    end: '11:10',
    location: 'ZACH 350',
    color: '#BDEAB5',
    weekday: 5,
  },
  {
    id: 'lunch-fri',
    title: 'Lunch',
    start: '12:00',
    end: '12:45',
    location: 'See Options',
    color: '#F5E8A6',
    weekday: 5,
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

const getInitialDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // If weekend (Saturday=6, Sunday=0), show Monday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const offset = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - offset);
    return monday;
  }
  // Otherwise, show current day
  const currentDay = new Date(today);
  currentDay.setHours(0, 0, 0, 0);
  return currentDay;
};

export default function ScheduleScreen() {
  const router = useRouter();
  
  // Global state from UserContext
  const {
    schedule,
    suggestions,
    acceptedSuggestions,
    rejectedSuggestions,
    acceptSuggestion,
    rejectSuggestion,
  } = useUser();
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [currentTime, setCurrentTime] = useState(new Date());

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Combine regular events with accepted suggestions
  const selectedEvents = useMemo(() => {
    const weekday = selectedDate.getDay();
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Get events from schedule or fall back to mock data
    let events = schedule && schedule.classes 
      ? schedule.classes
          .filter(cls => {
            // Filter by date if available
            if (cls.date) {
              return cls.date === dateStr;
            }
            // Filter by weekday if available
            if (cls.weekday !== undefined) {
              return cls.weekday === weekday;
            }
            return true;
          })
          .map(cls => ({
            id: cls.id || cls.name,
            title: cls.name || cls.title,
            start: cls.start,
            end: cls.end,
            location: cls.location || 'TBD',
            color: '#BDEAB5', // Green for classes
            isSuggestion: false,
          }))
      : scheduleEvents.filter((event) => event.weekday === weekday);
    
    // Add accepted suggestions as solid events
    if (acceptedSuggestions && acceptedSuggestions.length > 0) {
      const acceptedEvents = acceptedSuggestions
        .filter(sugg => {
          if (sugg.date) {
            return sugg.date === dateStr;
          }
          return true;
        })
        .map(sugg => ({
          id: `accepted-${sugg.id || sugg.location_name}`,
          title: `Gym - ${sugg.location_name}`,
          start: sugg.time_block?.start || sugg.start,
          end: sugg.time_block?.end || sugg.end,
          location: sugg.location_name,
          color: Colors.accepted.background,
          isSuggestion: false,
          isAccepted: true,
        }));
      events = [...events, ...acceptedEvents];
    }
    
    return events.sort((a, b) => minutesFromStart(a.start) - minutesFromStart(b.start));
  }, [selectedDate, schedule, acceptedSuggestions]);
  
  // Get visible suggestions (not accepted or rejected)
  const visibleSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    return suggestions.filter(sugg => {
      // Filter out accepted and rejected suggestions
      const isAccepted = acceptedSuggestions?.some(acc => 
        acc.id === sugg.id || acc.location_name === sugg.location_name
      );
      const isRejected = rejectedSuggestions?.some(rej => 
        rej.id === sugg.id || rej.location_name === sugg.location_name
      );
      
      if (isAccepted || isRejected) return false;
      
      // Filter by date if available
      if (sugg.date) {
        return sugg.date === dateStr;
      }
      
      return true;
    });
  }, [suggestions, acceptedSuggestions, rejectedSuggestions, selectedDate]);

  // DIAGNOSTIC: Log suggestions state
  useEffect(() => {
    console.log('📊 [schedule] SUGGESTIONS DIAGNOSTICS:', {
      suggestionsFromContext: suggestions,
      suggestionsCount: suggestions?.length || 0,
      suggestionsType: Array.isArray(suggestions) ? 'array' : typeof suggestions,
      acceptedCount: acceptedSuggestions?.length || 0,
      rejectedCount: rejectedSuggestions?.length || 0,
      selectedDate: selectedDate.toISOString().split('T')[0],
      visibleSuggestionsCount: visibleSuggestions.length,
      visibleSuggestions: visibleSuggestions,
      firstVisibleSuggestion: visibleSuggestions[0] || null,
    });

    // Check each visible suggestion's structure
    visibleSuggestions.forEach((sugg, index) => {
      const hasStart = !!(sugg.start || sugg.start_time || sugg.time_block?.start);
      const hasEnd = !!(sugg.end || sugg.end_time || sugg.time_block?.end);
      const hasDate = !!sugg.date;
      
      console.log(`📋 [schedule] SUGGESTION ${index}:`, {
        hasStart,
        hasEnd,
        hasDate,
        date: sugg.date,
        start: sugg.start || sugg.start_time || sugg.time_block?.start,
        end: sugg.end || sugg.end_time || sugg.time_block?.end,
        keys: Object.keys(sugg),
        fullSuggestion: sugg,
      });

      if (!hasStart || !hasEnd) {
        console.error(`❌ [schedule] SUGGESTION ${index} MISSING TIME FIELDS:`, sugg);
      }
      if (!hasDate) {
        console.warn(`⚠️ [schedule] SUGGESTION ${index} MISSING DATE:`, sugg);
      }
    });

    // Check why suggestions might not be visible
    if (suggestions?.length > 0 && visibleSuggestions.length === 0) {
      console.warn('⚠️ [schedule] SUGGESTIONS EXIST BUT NONE VISIBLE:', {
        totalSuggestions: suggestions.length,
        selectedDate: selectedDate.toISOString().split('T')[0],
        firstSuggestionDate: suggestions[0]?.date,
        dateMatch: suggestions[0]?.date === selectedDate.toISOString().split('T')[0],
        acceptedIds: acceptedSuggestions,
        rejectedIds: rejectedSuggestions,
        firstSuggestion: suggestions[0],
      });
    }
  }, [suggestions, visibleSuggestions, selectedDate, acceptedSuggestions, rejectedSuggestions]);

  const nowIndicatorTop = useMemo(() => {
    const startMinutes = DAY_START_HOUR * 60;
    const endMinutes = DAY_END_HOUR * 60;
    const minutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();

    if (!sameDay(currentTime, selectedDate)) return null;
    if (minutesNow < startMinutes || minutesNow > endMinutes) return null;
    return (minutesNow - startMinutes) * PIXELS_PER_MINUTE;
  }, [currentTime, selectedDate]);

  const showNowIndicator = nowIndicatorTop !== null;

  const handleChangeDay = (direction) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction);
      return next;
    });
  };
  
  /**
   * Handle accepting a suggestion
   * Converts suggestion to solid event
   */
  const handleAcceptSuggestion = (suggestion) => {
    acceptSuggestion(suggestion);
    // Show success feedback
    Alert.alert(
      'Suggestion Accepted!',
      `${suggestion.location_name} has been added to your schedule.`,
      [{ text: 'Great!' }]
    );
  };
  
  /**
   * Handle rejecting a suggestion
   * Hides the suggestion from display
   */
  const handleRejectSuggestion = (suggestion) => {
    Alert.alert(
      'Hide Suggestion?',
      `Hide ${suggestion.location_name} from your schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Hide', 
          style: 'destructive',
          onPress: () => rejectSuggestion(suggestion)
        },
      ]
    );
  };
  
  /**
   * Handle viewing event details
   */
  const handleViewDetails = (event) => {
    // TODO: Navigate to event detail screen (Phase 3.5)
    router.push({
      pathname: '/event',
      params: {
        eventId: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
      },
    });
  };

  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNumber = selectedDate.getDate();
  const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'long' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Schedule</Text>

        <View style={styles.headerRight} />
      </View>

      {/* DIAGNOSTIC: Debug Panel (Development Only) */}
      {__DEV__ && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🔍 Debug Info</Text>
          <Text style={styles.debugText}>
            Suggestions: {suggestions?.length || 0}
          </Text>
          <Text style={styles.debugText}>
            Visible: {visibleSuggestions.length}
          </Text>
          <Text style={styles.debugText}>
            Date: {selectedDate.toISOString().split('T')[0]}
          </Text>
          <Text style={styles.debugText}>
            Accepted: {acceptedSuggestions?.length || 0}
          </Text>
          <Text style={styles.debugText}>
            Rejected: {rejectedSuggestions?.length || 0}
          </Text>
          {visibleSuggestions.length === 0 && suggestions?.length > 0 && (
            <Text style={styles.debugError}>
              ⚠️ Suggestions exist but none visible!
            </Text>
          )}
          {visibleSuggestions.length > 0 && (
            <Text style={styles.debugSuccess}>
              ✅ {visibleSuggestions.length} suggestions visible
            </Text>
          )}
        </View>
      )}

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
              <TouchableOpacity style={styles.monthButton} onPress={() => handleChangeDay(-1)}>
                <Feather name="chevron-left" size={20} color="#333" />
              </TouchableOpacity>

              <View>
                <Text style={styles.monthText}>{monthLabel}</Text>
                <Text style={styles.weekLabel}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>

              <TouchableOpacity style={styles.monthButton} onPress={() => handleChangeDay(1)}>
                <Feather name="chevron-right" size={20} color="#333" />
              </TouchableOpacity>
            </View>

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

                  {/* Render regular events */}
                  {selectedEvents.map((event) => {
                    const startMinutes = minutesFromStart(event.start);
                    const endMinutes = minutesFromStart(event.end);
                    const offsetTop = (startMinutes - DAY_START_HOUR * 60) * PIXELS_PER_MINUTE;
                    const duration = endMinutes - startMinutes;
                    const height = Math.max(duration * PIXELS_PER_MINUTE - 8, 52);

                    return (
                      <View key={event.id} style={[styles.eventCard, { top: offsetTop, height, backgroundColor: event.color }]}>
                        <View style={styles.eventHeader}>
                          <Text 
                            style={styles.eventTitle}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {event.title}
                          </Text>
                          <TouchableOpacity onPress={() => handleViewDetails(event)}>
                            <Feather name="eye" size={16} color="#333" />
                          </TouchableOpacity>
                        </View>
                        <Text 
                          style={styles.eventTime}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatClockLabel(startMinutes)} - {formatClockLabel(endMinutes)}
                        </Text>
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color="#333" style={styles.locationIcon} />
                          <Text 
                            style={styles.locationText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {event.location}
                          </Text>
                        </View>
                        {event.isAccepted && (
                          <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                            <Text style={styles.acceptedText}>Added</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  
                  {/* Render suggestions as transparent overlays */}
                  {visibleSuggestions.map((suggestion, index) => {
                    const timeBlock = suggestion.time_block || {};
                    const start = timeBlock.start || suggestion.start || suggestion.start_time;
                    const end = timeBlock.end || suggestion.end || suggestion.end_time;
                    
                    // DIAGNOSTIC: Log time field extraction
                    if (!start || !end) {
                      console.error(`❌ [schedule] RENDER: Suggestion ${index} missing time:`, {
                        suggestion,
                        timeBlock,
                        start,
                        end,
                        hasStartTime: !!suggestion.start_time,
                        hasEndTime: !!suggestion.end_time,
                        hasStart: !!suggestion.start,
                        hasEnd: !!suggestion.end,
                        keys: Object.keys(suggestion),
                      });
                      return null;
                    }
                    
                    const startMinutes = minutesFromStart(start);
                    const endMinutes = minutesFromStart(end);
                    const offsetTop = (startMinutes - DAY_START_HOUR * 60) * PIXELS_PER_MINUTE;
                    const duration = endMinutes - startMinutes;
                    const height = Math.max(duration * PIXELS_PER_MINUTE - 8, 80);
                    
                    // Offset multiple suggestions slightly
                    const leftOffset = index * 4;
                    const rightOffset = index * 4;
                    
                    return (
                      <View 
                        key={`suggestion-${suggestion.id || index}`} 
                        style={[
                          styles.suggestionCard, 
                          { 
                            top: offsetTop, 
                            height,
                            left: 8 + leftOffset,
                            right: 8 + rightOffset,
                            backgroundColor: Colors.suggestion.background,
                            borderColor: Colors.suggestion.border,
                          }
                        ]}
                      >
                        {/* Rank badge */}
                        {suggestion.rank && (
                          <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>#{suggestion.rank}</Text>
                          </View>
                        )}
                        
                        {/* Suggestion header */}
                        <View style={styles.suggestionHeader}>
                          <Text style={styles.suggestionTitle}>
                            🏋️ {suggestion.location_name}
                          </Text>
                          <View style={styles.suggestionActions}>
                            <TouchableOpacity 
                              onPress={() => handleRejectSuggestion(suggestion)}
                              style={styles.suggestionActionButton}
                            >
                              <Ionicons name="close-circle" size={24} color={Colors.error} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleAcceptSuggestion(suggestion)}
                              style={styles.suggestionActionButton}
                            >
                              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        {/* Time */}
                        <Text style={styles.suggestionTime}>
                          {formatClockLabel(startMinutes)} - {formatClockLabel(endMinutes)}
                        </Text>
                        
                        {/* Commute info */}
                        {suggestion.commute_info && (
                          <View style={styles.commuteInfo}>
                            <Ionicons name="walk-outline" size={12} color={Colors.text.secondary} />
                            <Text style={styles.commuteText}>
                              {suggestion.commute_info.total_commute} min commute
                            </Text>
                          </View>
                        )}
                        
                        {/* Reasoning */}
                        {suggestion.reasoning && (
                          <Text style={styles.suggestionReasoning} numberOfLines={2}>
                            💡 {suggestion.reasoning}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
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
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // Same as back button width for centering
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
    overflow: 'hidden',  // Prevent content from spilling outside
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
    flex: 1,
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
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.success + '40',
  },
  acceptedText: {
    fontSize: 11,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  // Suggestion overlay styles
  suggestionCard: {
    position: 'absolute',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.light,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 4,
  },
  suggestionActionButton: {
    padding: 2,
  },
  suggestionTime: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  commuteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  commuteText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  suggestionReasoning: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
  // Debug Panel Styles
  debugPanel: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  debugError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 8,
    fontWeight: '600',
  },
  debugSuccess: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 8,
    fontWeight: '600',
  },
});
