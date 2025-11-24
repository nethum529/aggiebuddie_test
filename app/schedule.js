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

const DAY_START_HOUR = 5;   // 5 AM
const DAY_END_HOUR = 23;     // 11 PM
const HOUR_HEIGHT = 50;      // Reduced for more compact display
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) => DAY_START_HOUR + index);
const TIMELINE_HEIGHT = (HOURS.length - 1) * HOUR_HEIGHT;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

/**
 * Group suggestions by time block (date + start_time + end_time)
 * Sort each group by rank (ascending: 1 = best)
 * 
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {Object} Grouped suggestions: { "date_start_end": [suggestions] }
 */
const groupSuggestionsByTimeBlock = (suggestions) => {
  if (!suggestions || suggestions.length === 0) return {};
  
  const grouped = {};
  
  suggestions.forEach(sugg => {
    // Create unique key for time block
    const date = sugg.date || '';
    const start = sugg.start_time || sugg.start || '';
    const end = sugg.end_time || sugg.end || '';
    const blockKey = `${date}_${start}_${end}`;
    
    if (!grouped[blockKey]) {
      grouped[blockKey] = [];
    }
    grouped[blockKey].push(sugg);
  });
  
  // Sort each group by rank (ascending: 1 = best, lower is better)
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => {
      const rankA = a.rank || 999; // Default to high rank if missing
      const rankB = b.rank || 999;
      return rankA - rankB; // Ascending: 1 comes before 2
    });
  });
  
  return grouped;
};

/**
 * Get unique identifier for a suggestion
 * Uses existing ID if available, otherwise creates from date + time + location
 * 
 * @param {Object} suggestion - Suggestion object
 * @returns {string} Unique identifier
 */
const getSuggestionId = (suggestion) => {
  // Use existing ID if available
  if (suggestion.id) {
    return String(suggestion.id);
  }
  
  // Create unique ID from date + time + location
  const date = suggestion.date || '';
  const start = suggestion.start_time || suggestion.start || '';
  const location = suggestion.location_name || suggestion.location_id || '';
  return `${date}_${start}_${location}`;
};

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
  // Handle null/undefined
  if (!timeString || typeof timeString !== 'string') {
    console.warn('⚠️ [schedule] minutesFromStart: Invalid timeString:', timeString);
    return 0; // Return 0 as safe default
  }
  
  // Parse time
  const parts = timeString.split(':');
  if (parts.length < 2) {
    console.warn('⚠️ [schedule] minutesFromStart: Invalid format:', timeString);
    return 0;
  }
  
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  
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

/**
 * Get building name for a class, checking multiple sources
 * 
 * Priority:
 * 1. building_id in class object (from backend)
 * 2. selectedBuildings[course_id] (from UserContext)
 * 3. Raw location from ICS (cls.location)
 * 4. 'TBD' as last resort
 * 
 * @param {Object} cls - Class object from schedule
 * @param {Object} selectedBuildings - Map of course_id to building_id
 * @param {Array} buildings - Array of building objects
 * @returns {string} Building name or fallback
 */
const getBuildingNameForClass = (cls, selectedBuildings, buildings) => {
  // Priority 1: Check building_id in class object (from backend)
  let buildingId = cls.building_id;

  // Priority 2: Check selectedBuildings (from UserContext)
  if (!buildingId && cls.course_id && selectedBuildings) {
    buildingId = selectedBuildings[cls.course_id];
  }

  // If we have a building_id, look up the building name
  if (buildingId && buildings && Array.isArray(buildings)) {
    const building = buildings.find(b => b.id === buildingId);
    if (building && building.name) {
      return building.name;
    }
  }

  // Fallback 1: Use raw location from ICS (e.g., "ZACH")
  if (cls.location && cls.location !== 'TBD' && cls.location.trim() !== '') {
    return cls.location;
  }

  // Fallback 2: Return 'TBD' as last resort
  return 'TBD';
};

/**
 * Extract and normalize time from a suggestion object
 * 
 * Checks multiple possible fields in priority order:
 * 1. start_time / end_time (standard suggestion fields)
 * 2. time_block.start / time_block.end (if time_block exists)
 * 3. start / end (fallback, rarely used)
 * 
 * Also handles datetime strings by extracting time portion.
 * 
 * @param {Object} sugg - Suggestion object
 * @param {string} type - 'start' or 'end'
 * @returns {string|null} Time in "HH:MM" format, or null if not found
 */
const normalizeTimeFromSuggestion = (sugg, type) => {
  if (!sugg) return null;
  
  // Priority 1: Check start_time/end_time (standard fields)
  let time = type === 'start' 
    ? (sugg.start_time || sugg.time_block?.start_time)
    : (sugg.end_time || sugg.time_block?.end_time);
  
  // Priority 2: Check time_block.start/end
  if (!time && sugg.time_block) {
    time = type === 'start' ? sugg.time_block.start : sugg.time_block.end;
  }
  
  // Priority 3: Check start/end (fallback)
  if (!time) {
    time = type === 'start' ? sugg.start : sugg.end;
  }
  
  // If time is already in "HH:MM" format, return it
  if (time && typeof time === 'string') {
    // Check if it's "HH:MM" format
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      return time;
    }
    
    // If it's a datetime string, extract time part
    // e.g., "2024-11-24T10:45:00" → "10:45"
    const datetimeMatch = time.match(/T(\d{2}):(\d{2})/);
    if (datetimeMatch) {
      return `${datetimeMatch[1]}:${datetimeMatch[2]}`;
    }
  }
  
  // Return null if time not found or invalid
  return null;
};

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
    acceptSuggestion,
    selectedBuildings,  // Building assignments
    buildings,          // Building list for name lookup
  } = useUser();
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Local state for rejected suggestions (Set for O(1) lookup)
  const [rejectedSuggestionIds, setRejectedSuggestionIds] = useState(new Set());

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
            location: getBuildingNameForClass(cls, selectedBuildings, buildings),
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
        .map(sugg => {
          const startTime = normalizeTimeFromSuggestion(sugg, 'start');
          const endTime = normalizeTimeFromSuggestion(sugg, 'end');
          
          // Skip if times are missing (shouldn't happen, but safety check)
          if (!startTime || !endTime) {
            console.warn('⚠️ [schedule] Accepted suggestion missing times:', sugg);
            return null;
          }
          
          return {
            id: `accepted-${sugg.id || sugg.location_name || getSuggestionId(sugg)}`,
            title: `Gym - ${sugg.location_name}`,
            start: startTime,  // Normalized "HH:MM" format
            end: endTime,      // Normalized "HH:MM" format
            location: sugg.location_name,
            color: Colors.accepted.background,
            isSuggestion: false,  // Renders as solid card
            isAccepted: true,
          };
        })
        .filter(event => event !== null);  // Remove null entries
      
      events = [...events, ...acceptedEvents];
    }
    
    // Sort events by start time, filtering out invalid events
    return events
      .filter(event => event.start && event.end)  // Filter out invalid events
      .sort((a, b) => {
        // Safe sorting with fallback
        const aTime = minutesFromStart(a.start || '00:00');
        const bTime = minutesFromStart(b.start || '00:00');
        return aTime - bTime;
      });
  }, [selectedDate, schedule, acceptedSuggestions]);
  
  // Get visible suggestions (only top-ranked per time block)
  const visibleSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Group suggestions by time block
    const grouped = groupSuggestionsByTimeBlock(suggestions);
    
    // Get top-ranked suggestion for each block
    const topRanked = [];
    
    Object.values(grouped).forEach(blockSuggestions => {
      // Filter by date first
      const dateFiltered = blockSuggestions.filter(sugg => {
        if (sugg.date) {
          return sugg.date === dateStr;
        }
        // If no date, include it (fallback for old data)
        return true;
      });
      
      if (dateFiltered.length === 0) return;
      
      // Get top-ranked suggestion (index 0 after sorting)
      const top = dateFiltered[0];
      
      // Check if not accepted or rejected
      const isAccepted = acceptedSuggestions?.some(acc => {
        // Match by ID or location_name
        if (acc.id && top.id) {
          return acc.id === top.id;
        }
        if (acc.location_name && top.location_name) {
          return acc.location_name === top.location_name;
        }
        return false;
      });
      
      // Check if rejected using simple Set lookup
      const topId = getSuggestionId(top);
      const isRejected = rejectedSuggestionIds.has(topId);
      
      // Only include if not accepted and not rejected
      if (!isAccepted && !isRejected) {
        topRanked.push(top);
      }
    });
    
    return topRanked;
  }, [suggestions, acceptedSuggestions, rejectedSuggestionIds, selectedDate]);

  // DIAGNOSTIC: Log suggestions state
  useEffect(() => {
    console.log('📊 [schedule] SUGGESTIONS DIAGNOSTICS:', {
      suggestionsFromContext: suggestions,
      suggestionsCount: suggestions?.length || 0,
      suggestionsType: Array.isArray(suggestions) ? 'array' : typeof suggestions,
      acceptedCount: acceptedSuggestions?.length || 0,
      rejectedCount: rejectedSuggestionIds.size,
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
        rejectedIds: Array.from(rejectedSuggestionIds),
        firstSuggestion: suggestions[0],
      });
    }
  }, [suggestions, visibleSuggestions, selectedDate, acceptedSuggestions, rejectedSuggestionIds]);

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
   * If there are more suggestions in the same time block, show next one
   * If this is the last suggestion, hide the entire block
   */
  const handleRejectSuggestion = (suggestion) => {
    // Get unique ID for this suggestion
    const suggestionId = getSuggestionId(suggestion);
    
    // Group suggestions to find remaining options
    const grouped = groupSuggestionsByTimeBlock(suggestions);
    const blockKey = `${suggestion.date || ''}_${suggestion.start_time || suggestion.start || ''}_${suggestion.end_time || suggestion.end || ''}`;
    const blockSuggestions = grouped[blockKey] || [];
    
    // Filter out already rejected suggestions
    const remainingSuggestions = blockSuggestions.filter(s => {
      const sId = getSuggestionId(s);
      return !rejectedSuggestionIds.has(sId) && sId !== suggestionId;
    });
    
    // Determine message based on remaining options
    const hasMoreOptions = remainingSuggestions.length > 0;
    const nextLocation = hasMoreOptions ? remainingSuggestions[0].location_name : null;
    
    Alert.alert(
      'Hide This Suggestion?',
      hasMoreOptions
        ? `Hide ${suggestion.location_name}? The next best option (${nextLocation}) will be shown.`
        : `Hide ${suggestion.location_name}? This is the last option for this time slot.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Hide', 
          style: 'destructive',
          onPress: () => {
            // Immediately add to rejected Set
            setRejectedSuggestionIds(prev => new Set([...prev, suggestionId]));
            // Card disappears immediately via useMemo, next suggestion appears automatically
          }
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
            Rejected: {rejectedSuggestionIds.size}
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
            {/* Navigation arrows - minimal, clean */}
            <View style={styles.timelineNav}>
              <TouchableOpacity style={styles.navButton} onPress={() => handleChangeDay(-1)}>
                <Feather name="chevron-left" size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => handleChangeDay(1)}>
                <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
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
                      <View key={event.id} style={[styles.eventCard, { top: offsetTop, height, borderLeftColor: event.color }]}>
                        <View style={styles.eventHeader}>
                          <Text 
                            style={styles.eventTitle}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {event.title}
                          </Text>
                          <TouchableOpacity onPress={() => handleViewDetails(event)}>
                            <Feather name="eye" size={14} color="#5F6368" />
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
                          <Ionicons name="location-outline" size={12} color="#5F6368" style={styles.locationIcon} />
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
                            <Ionicons name="checkmark-circle" size={10} color={Colors.success} />
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
                    
                    // Clamp times to calendar bounds
                    let startMinutes = minutesFromStart(start);
                    let endMinutes = minutesFromStart(end);
                    
                    // Clamp to calendar start/end times
                    startMinutes = Math.max(startMinutes, DAY_START_HOUR * 60);
                    endMinutes = Math.min(endMinutes, DAY_END_HOUR * 60);
                    
                    // Validate range - skip if completely outside calendar
                    if (startMinutes >= DAY_END_HOUR * 60 || endMinutes <= DAY_START_HOUR * 60) {
                      console.warn('⚠️ [schedule] Suggestion outside calendar bounds:', {
                        suggestion,
                        start_time: suggestion.start_time || suggestion.start,
                        end_time: suggestion.end_time || suggestion.end,
                        startMinutes,
                        endMinutes,
                      });
                      return null; // Don't render if outside visible calendar
                    }
                    
                    // Additional validation: Check if times are reasonable
                    if (endMinutes <= startMinutes) {
                      console.error(`❌ [schedule] RENDER: Invalid time range (end <= start):`, {
                        suggestion,
                        start,
                        end,
                        startMinutes,
                        endMinutes,
                      });
                      return null; // Skip invalid time ranges
                    }
                    
                    // Calculate position and height
                    const offsetTop = (startMinutes - DAY_START_HOUR * 60) * PIXELS_PER_MINUTE;
                    const duration = endMinutes - startMinutes;
                    
                    // Calculate height with maximum constraint
                    const maxHeight = TIMELINE_HEIGHT - offsetTop; // Don't exceed calendar
                    const calculatedHeight = duration * PIXELS_PER_MINUTE - 8;
                    const height = Math.min(
                      Math.max(calculatedHeight, 80), // Minimum 80px
                      maxHeight // Maximum: don't exceed calendar bounds
                    );
                    
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
    backgroundColor: '#FFFFFF',  // Pure white like Google Calendar
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    backgroundColor: '#FFFFFF',    // White
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',  // Google Calendar gray
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
    borderRadius: 0,              // No rounded corners (Google Calendar style)
    backgroundColor: '#FFFFFF',  // White
    padding: 0,                   // No padding (full width)
    gap: 0,
    minHeight: 580,
  },
  dayColumn: {
    width: 80,                    // Reduced from 96 for more compact
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8EAED', // Subtle right border
  },
  dayBadge: {
    width: '100%',
    borderRadius: 8,              // Less rounded
    backgroundColor: '#F8F9FA',  // Very light gray (Google Calendar style)
    paddingVertical: 12,         // Reduced from 18
    alignItems: 'center',
    marginBottom: 8,             // Reduced from 16
    borderWidth: 1,
    borderColor: '#E8EAED',      // Subtle border
  },
  dayText: {
    fontSize: 12,                 // Reduced from 16
    fontWeight: '600',
    color: '#5F6368',            // Google Calendar gray text
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 24,                 // Reduced from 32
    fontWeight: '400',
    color: '#202124',             // Google Calendar dark text
    marginTop: 4,
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
    fontSize: 11,                 // Reduced from 14
    color: '#5F6368',            // Google Calendar gray
    fontWeight: '400',
  },
  lastTimeLabel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    textAlign: 'center',
  },
  timelineColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',  // White
    borderRadius: 0,              // No rounded corners
    padding: 12,                  // Reduced from 16
    borderLeftWidth: 1,
    borderLeftColor: '#E8EAED',  // Subtle left border
  },
  timelineNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  timelineBody: {
    marginTop: 8,                 // Reduced from 16
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
    borderBottomColor: '#E8EAED',  // Google Calendar gray
    borderBottomWidth: 1,           // Slightly more visible
  },
  eventsLayer: {
    flex: 1,
    height: TIMELINE_HEIGHT,
    position: 'relative',
    paddingHorizontal: 0,        // No horizontal padding (full width)
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
    color: '#EA4335',              // Google Calendar red
    fontSize: 10,
    fontWeight: '500',
    marginRight: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  nowLine: {
    height: 2,
    backgroundColor: '#EA4335',    // Google Calendar red
    flex: 1,
    borderRadius: 0,
  },
  eventCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 4,                // Less rounded (Google Calendar style)
    padding: 8,                    // Reduced from 12
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',    // White background
    borderLeftWidth: 3,            // Colored left border
    borderLeftColor: '#4285F4',    // Default blue (will be overridden by event.color)
    shadowColor: '#000',
    shadowOpacity: 0.08,           // Subtle shadow
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 13,                 // Reduced from 16
    fontWeight: '600',
    color: '#202124',             // Google Calendar dark text
    flex: 1,
  },
  eventTime: {
    fontSize: 11,                 // Reduced from 13
    color: '#5F6368',             // Google Calendar gray
    marginTop: 2,                 // Reduced from 4
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
    fontSize: 11,                 // Reduced from 13
    color: '#5F6368',             // Google Calendar gray
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
    borderRadius: 4,             // Less rounded (Google Calendar style)
    padding: 8,                  // Reduced from 12
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: Colors.accent,
    shadowOpacity: 0.15,         // Reduced shadow
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
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
    fontSize: 13,                // Reduced from 15
    fontWeight: '600',
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
    fontSize: 11,                // Reduced from 12
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,             // Reduced from 4
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
    color: '#5F6368',            // Google Calendar gray
    fontSize: 13,
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
