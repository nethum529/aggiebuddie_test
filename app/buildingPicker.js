/**
 * Building Picker Screen
 * 
 * Allows users to assign building locations to each of their classes.
 * Comes after schedule upload, before generating suggestions.
 * 
 * ✅ BACKEND READY:
 * - GET /api/buildings endpoint is FUNCTIONAL and tested
 * - POST /api/schedule/add-locations endpoint is FUNCTIONAL and tested
 * - Currently uses MOCK data for testing UI (will use real schedule once integrated)
 * 
 * MOBILE SETUP:
 * - Configure ApiConfig.js with your computer's IP address for mobile testing
 * - See TROUBLESHOOTING_GUIDE.md for step-by-step instructions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import BuildingDropdown from '../components/BuildingDropdown';
import * as api from '../services/api';
import { useUser } from '../contexts/UserContext';
import ErrorMessage from '../components/ErrorMessage';

// MOCK DATA for testing (until Phase 2.2 provides real schedule)
const MOCK_CLASSES = [
  {
    id: 'class_1',
    name: 'CSCE 314 - Programming Languages',
    location: 'TBD',
    days: 'MWF',
    time: '10:20 - 11:10 AM',
  },
  {
    id: 'class_2',
    name: 'MATH 308 - Differential Equations',
    location: 'TBD',
    days: 'TR',
    time: '11:10 AM - 12:25 PM',
  },
  {
    id: 'class_3',
    name: 'ENGR 216 - Statics',
    location: 'TBD',
    days: 'MWF',
    time: '2:20 - 3:10 PM',
  },
];

export default function BuildingPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Global state from UserContext
  const {
    studentId,
    schedule,
    buildings: contextBuildings,
    setBuildings: setContextBuildings,
    selectedBuildings,
    assignBuildingToClass,
    unassignBuildingFromClass,
  } = useUser();
  
  // Local state management
  const [classes, setClasses] = useState([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch buildings from backend on mount
   * GET /api/buildings - This endpoint IS available (Phase 2.1)
   */
  useEffect(() => {
    fetchBuildings();
    loadClasses();
  }, []);

  /**
   * Load classes from uploaded schedule
   * 
   * Gets schedule data from UserContext (uploaded in previous screen).
   * Extracts UNIQUE courses from all class occurrences (backend expands recurring events).
   * Falls back to MOCK data if no schedule is available yet.
   */
  const loadClasses = () => {
    if (schedule && schedule.classes) {
      // Extract unique courses from all occurrences
      // Backend returns ALL class occurrences (94+) because it expands recurring events
      // We only want unique courses for building assignment UI
      const uniqueCourses = {};
      
      schedule.classes.forEach(cls => {
        const courseId = cls.course_id || cls.id;
        
        // Only store first occurrence of each unique course
        if (!uniqueCourses[courseId]) {
          uniqueCourses[courseId] = {
            id: courseId,
            name: cls.course_id,  // Backend stores name in course_id field
            days: cls.days || extractDays(cls.start) || 'TBD',
            time: cls.time || formatTime(cls.start, cls.end),
            location: cls.location || 'TBD'
          };
        }
      });
      
      const uniqueCoursesArray = Object.values(uniqueCourses);
      console.log(`Loaded ${uniqueCoursesArray.length} unique courses from ${schedule.classes.length} total occurrences`);
      setClasses(uniqueCoursesArray);
    } else {
      // Fall back to mock data for testing
      console.log('No schedule in context, using MOCK data');
      setClasses(MOCK_CLASSES);
    }
  };

  /**
   * Format time from datetime objects to human-readable string
   * 
   * @param {Date|string} start - Start datetime
   * @param {Date|string} end - End datetime
   * @returns {string} Formatted time range (e.g., "10:20 AM - 11:10 AM")
   */
  const formatTime = (start, end) => {
    if (!start || !end) return 'TBD';
    
    try {
      // Handle both string and Date object inputs
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;
      
      // Verify valid dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'TBD';
      }
      
      // Format to readable time string
      const startTime = startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      const endTime = endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      
      return `${startTime} - ${endTime}`;
    } catch (e) {
      console.error('Time formatting error:', e);
      return 'TBD';
    }
  };

  /**
   * Extract day abbreviations from datetime object
   * 
   * @param {Date|string} datetime - Class datetime
   * @returns {string|null} Day abbreviation (e.g., "M", "T", "W")
   */
  const extractDays = (datetime) => {
    if (!datetime) return null;
    
    try {
      const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
      if (isNaN(date.getTime())) return null;
      
      const dayMap = {
        0: 'Su', // Sunday
        1: 'M',  // Monday
        2: 'T',  // Tuesday
        3: 'W',  // Wednesday
        4: 'R',  // Thursday (R to avoid confusion with Tuesday)
        5: 'F',  // Friday
        6: 'S'   // Saturday
      };
      
      return dayMap[date.getDay()] || null;
    } catch (e) {
      console.error('Day extraction error:', e);
      return null;
    }
  };

  /**
   * Fetch buildings from backend
   * ✅ This endpoint is FUNCTIONAL (GET /api/buildings)
   */
  const fetchBuildings = async () => {
    try {
      setIsLoadingBuildings(true);
      setError(null);

      // Use centralized API service
      const result = await api.getBuildings();

      // Store buildings in global UserContext
      if (result.success && result.buildings) {
        setContextBuildings(result.buildings);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (err) {
      console.error('Fetch buildings error:', err);
      setError(err.message);
      
      // Use mock buildings for testing when backend is down
      useMockBuildings();
    } finally {
      setIsLoadingBuildings(false);
    }
  };

  /**
   * Use mock buildings for testing when backend is unavailable
   */
  const useMockBuildings = () => {
    const mockBuildings = [
      { id: 'zach', name: 'Zachry Engineering Center', address: '3127 TAMU' },
      { id: 'bloc', name: 'Bright Learning Complex', address: '3143 TAMU' },
      { id: 'hrbb', name: 'H.R. Bright Building', address: '3139 TAMU' },
      { id: 'msc', name: 'Memorial Student Center', address: '275 Joe Routt Blvd' },
      { id: 'wehner', name: 'Wehner Building', address: '210 Olsen Blvd' },
      { id: 'blocker', name: 'Blocker Building', address: '245 Olsen Blvd' },
    ];
    setContextBuildings(mockBuildings);
    console.log('Using mock buildings for UI testing');
  };

  /**
   * Handle building selection for a class
   * Uses UserContext to store selections globally
   * Handles null case when user clears selection (e.g., by editing input)
   */
  const handleBuildingSelect = (className, building) => {
    if (building === null || building === undefined) {
      // Clear selection when building is null (user edited input)
      unassignBuildingFromClass(className);
    } else {
      // Assign building when building object provided
      assignBuildingToClass(className, building.id);
    }
  };

  /**
   * Check if all classes have buildings assigned
   */
  const isComplete = () => {
    return classes.every(cls => selectedBuildings[cls.name || cls.id]);
  };

  /**
   * Handle finish button - submit building assignments
   * 
   * ✅ BACKEND READY:
   * POST /api/schedule/add-locations endpoint is functional
   * 
   * Process:
   * 1. Validates all classes have buildings
   * 2. Submits to backend via api.addLocations()
   * 3. Navigates to next screen on success
   */
  const handleFinish = async () => {
    if (!isComplete()) {
      Alert.alert(
        'Incomplete',
        'Please assign a building to all classes before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use studentId from UserContext or fallback
      const currentStudentId = studentId || 'student_1';
      
      // Submit building assignments using API service
      await api.addLocations(currentStudentId, selectedBuildings);

      // Success! Navigate to home (or activityPreferences when Phase 3.3 is done)
      // TODO: Change to /activityPreferences when Phase 3.3 is complete
      router.push('/home');

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
        
      // For testing: offer to continue anyway if backend is down
      if (err.message.includes('Cannot connect')) {
        Alert.alert(
          'UI Test Mode',
          'Building assignments saved locally. Backend connection failed. Continue to home?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => router.push('/home') },
          ]
        );
      } else {
        setError(err.message || 'Failed to save assignments');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (isSubmitting) {
      return;
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={isSubmitting}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.light} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Assign Buildings</Text>
        
        <View style={styles.headerRight} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {Object.keys(selectedBuildings).length} of {classes.length} assigned
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: classes.length > 0
                  ? `${(Object.keys(selectedBuildings).length / classes.length) * 100}%`
                  : '0%',
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            Where are your classes?
          </Text>
          <Text style={styles.instructionsText}>
            Select the building location for each class. This helps us suggest the best gyms based on your class flow.
          </Text>
        </View>

        {/* Loading State */}
        {isLoadingBuildings && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading buildings...</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            onRetry={fetchBuildings}
          />
        )}

        {/* Class Cards */}
        {!isLoadingBuildings && classes.length > 0 && (
          <View style={styles.classesContainer}>
            {classes.map((cls, index) => (
              <View key={cls.id} style={styles.classCard}>
                {/* Class Info */}
                <View style={styles.classHeader}>
                  <View style={styles.classNumberBadge}>
                    <Text style={styles.classNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classDetails}>
                      {cls.days} • {cls.time}
                    </Text>
                  </View>
                </View>

                {/* Building Selector */}
                <View style={styles.buildingSelector}>
                  <Text style={styles.selectorLabel}>Building Location:</Text>
                  <BuildingDropdown
                    buildings={contextBuildings}
                    selectedBuilding={
                      selectedBuildings[cls.name || cls.id]
                        ? contextBuildings.find(b => b.id === selectedBuildings[cls.name || cls.id])
                        : null
                    }
                    onSelect={(building) => handleBuildingSelect(cls.name || cls.id, building)}
                    placeholder="Select building..."
                    disabled={isLoadingBuildings || isSubmitting}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoadingBuildings && classes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Classes Found</Text>
            <Text style={styles.emptyText}>
              No classes were found in your schedule. Please upload a valid ICS file.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Finish Button (Fixed at bottom) */}
      {!isLoadingBuildings && classes.length > 0 && (
        <View style={styles.finishContainer}>
          <TouchableOpacity
            style={[
              styles.finishButton,
              (!isComplete() || isSubmitting) && styles.finishButtonDisabled,
            ]}
            onPress={handleFinish}
            disabled={!isComplete() || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color={Colors.text.light} style={styles.buttonLoader} />
                <Text style={styles.finishButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Text style={styles.finishButtonText}>Finish & Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.light} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.light,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // Balance the back button
  },

  // Progress
  progressContainer: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 100, // Space for fixed finish button
  },

  // Instructions
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 22,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },

  // Error
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 8,
    lineHeight: 20,
  },
  dismissErrorButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  dismissErrorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },

  // Classes
  classesContainer: {
    marginBottom: 20,
    overflow: 'visible',  // Allow dropdown to extend beyond container
  },
  classCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'visible',  // Allow dropdown to extend beyond card boundaries
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classNumberText: {
    color: Colors.text.light,
    fontSize: 16,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  buildingSelector: {
    marginTop: 8,
    position: 'relative',  // Create stacking context
    zIndex: 1000,  // Higher z-index to match dropdown container
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },

  // Finish button
  finishContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 20,
    paddingBottom: 30,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  finishButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.light,
    marginRight: 8,
  },
  buttonLoader: {
    marginRight: 12,
  },
});

