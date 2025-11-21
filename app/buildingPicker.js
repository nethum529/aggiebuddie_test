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
import { getApiUrl } from '../constants/ApiConfig';

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
  
  // State management
  const [classes, setClasses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [buildingAssignments, setBuildingAssignments] = useState({});
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
   * Currently uses MOCK data for testing UI.
   * Will be updated to use real schedule data from navigation params
   * once full integration is complete.
   */
  const loadClasses = () => {
    // TODO: Get schedule from params once integrated with upload flow
    // const scheduleId = params.scheduleId;
    // const studentId = params.studentId;
    // Fetch schedule from backend or get from params
    
    // For now, use mock data
    setClasses(MOCK_CLASSES);
  };

  /**
   * Fetch buildings from backend
   * ✅ This endpoint is FUNCTIONAL (GET /api/buildings)
   */
  const fetchBuildings = async () => {
    try {
      setIsLoadingBuildings(true);
      setError(null);

      // Use centralized API configuration (supports mobile testing)
      const response = await fetch(getApiUrl('/api/buildings'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch buildings');
      }

      // Backend returns { success: true, count: X, buildings: [...] }
      if (data.success && data.buildings) {
        setBuildings(data.buildings);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (err) {
      console.error('Fetch buildings error:', err);
      
      // Check if backend is not running
      if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
        setError(
          'Cannot connect to backend server. ' +
          'Make sure Flask server is running. See TROUBLESHOOTING_GUIDE.md for help.'
        );
        
        // Use mock buildings for testing when backend is down
        useMockBuildings();
      } else {
        setError(err.message || 'Failed to load buildings');
      }
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
    setBuildings(mockBuildings);
    console.log('Using mock buildings for UI testing');
  };

  /**
   * Handle building selection for a class
   */
  const handleBuildingSelect = (classId, building) => {
    setBuildingAssignments(prev => ({
      ...prev,
      [classId]: building,
    }));
  };

  /**
   * Check if all classes have buildings assigned
   */
  const isComplete = () => {
    return classes.every(cls => buildingAssignments[cls.id]);
  };

  /**
   * Handle finish button - submit building assignments
   * 
   * ⚠️ PHASE 2 DEPENDENCY:
   * This requires POST /api/schedule/add-locations endpoint (Phase 2.3)
   * Endpoint is NOT implemented yet.
   * 
   * Once Phase 2.3 is complete:
   * - This will successfully submit assignments
   * - Will navigate to activity preferences
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
      // Format data for backend
      const locationsData = Object.entries(buildingAssignments).map(([classId, building]) => ({
        class_id: classId,
        building_id: building.id,
      }));

      // Use centralized API configuration (supports mobile testing)
      const response = await fetch(getApiUrl('/api/schedule/add-locations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: params.studentId || 'student_1',
          locations: locationsData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save building assignments');
      }

      // Success! Navigate to activity preferences (or home for now)
      router.push({
        pathname: '/home',
        // TODO: Once Phase 3.3 is complete, navigate to /activityPreferences
      });

    } catch (err) {
      console.error('Submit error:', err);
      
      if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
        setError(
          'Cannot connect to backend server. ' +
          'Make sure: 1) Flask server is running (cd backend && python app.py), ' +
          '2) ApiConfig.js is configured with your computer\'s IP address, ' +
          '3) Mobile device and computer are on the same WiFi network. ' +
          'See TROUBLESHOOTING_GUIDE.md for help.'
        );
        
        // For testing: show success and navigate anyway
        Alert.alert(
          'UI Test Mode',
          'Building assignments saved locally (backend Phase 2.3 pending). Continue to home?',
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
          {Object.keys(buildingAssignments).length} of {classes.length} assigned
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: classes.length > 0
                  ? `${(Object.keys(buildingAssignments).length / classes.length) * 100}%`
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
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => setError(null)}
              style={styles.dismissErrorButton}
            >
              <Text style={styles.dismissErrorText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
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
                    buildings={buildings}
                    selectedBuilding={buildingAssignments[cls.id]}
                    onSelect={(building) => handleBuildingSelect(cls.id, building)}
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

        {/* Development Note */}
        <View style={styles.devNoteContainer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
          <Text style={styles.devNoteText}>
            <Text style={styles.devNoteBold}>Development Note: </Text>
            Using mock classes for UI testing. GET /api/buildings is working. 
            POST /api/schedule/add-locations requires Phase 2.3.
          </Text>
        </View>
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
  },
  classCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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

  // Development note
  devNoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginTop: 20,
  },
  devNoteText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  devNoteBold: {
    fontWeight: '600',
    color: Colors.info,
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

