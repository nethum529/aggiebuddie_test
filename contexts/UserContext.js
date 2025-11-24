/**
 * User Context
 * 
 * Global state management for AggieBuddie app.
 * Provides centralized access to user data across all screens.
 * 
 * State includes:
 * - studentId: Unique identifier for the user
 * - schedule: Parsed schedule with classes
 * - buildings: List of campus buildings
 * - suggestions: Generated activity suggestions
 * - selectedBuildings: Map of class names to building IDs
 * 
 * Usage:
 *   // In any component
 *   import { useUser } from '../contexts/UserContext';
 *   
 *   function MyComponent() {
 *     const { studentId, schedule, setSchedule } = useUser();
 *     // Use the context...
 *   }
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const UserContext = createContext(undefined);

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_STATE = {
  // User identification
  studentId: null,

  // Schedule data
  schedule: null, // Parsed schedule from backend
  scheduleId: null, // Backend schedule ID

  // Campus data
  buildings: [], // List of all campus buildings

  // Building assignments
  selectedBuildings: {}, // Map: { "CSCE 121-501": "zach", ... }
  
  // Activity suggestions
  suggestions: [], // Array of suggestion objects from backend
  acceptedSuggestions: [], // Array of suggestion IDs that user accepted
  rejectedSuggestions: [], // Array of suggestion IDs that user rejected

  // Activity preferences
  activityPreferences: {
    startOfDay: '08:00',
    endOfDay: '18:00',
    activityType: 'exercise',
    durationMinutes: 60,
  },

  // UI state
  isOnboarded: false, // Has user completed onboarding flow?
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * UserProvider Component
 * 
 * Wraps the app to provide global state access.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function UserProvider({ children }) {
  // State
  const [studentId, setStudentId] = useState(INITIAL_STATE.studentId);
  const [schedule, setSchedule] = useState(INITIAL_STATE.schedule);
  const [scheduleId, setScheduleId] = useState(INITIAL_STATE.scheduleId);
  const [buildings, setBuildings] = useState(INITIAL_STATE.buildings);
  const [selectedBuildings, setSelectedBuildings] = useState(INITIAL_STATE.selectedBuildings);
  const [suggestions, setSuggestionsRaw] = useState(INITIAL_STATE.suggestions);
  
  /**
   * Validated setter for suggestions - ensures it's always an array
   * 
   * @param {any} newSuggestions - The new suggestions value (will be validated)
   */
  const setSuggestions = (newSuggestions) => {
    const validated = Array.isArray(newSuggestions) ? newSuggestions : [];
    setSuggestionsRaw(validated);
  };
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(INITIAL_STATE.acceptedSuggestions);
  const [rejectedSuggestions, setRejectedSuggestions] = useState(INITIAL_STATE.rejectedSuggestions);
  const [activityPreferences, setActivityPreferences] = useState(INITIAL_STATE.activityPreferences);
  const [isOnboarded, setIsOnboarded] = useState(INITIAL_STATE.isOnboarded);

  // ========================================
  // DERIVED STATE
  // ========================================

  /**
   * Get total number of classes in schedule
   */
  const totalClasses = schedule?.classes?.length || 0;

  /**
   * Get number of classes with assigned buildings
   */
  const assignedClassesCount = Object.keys(selectedBuildings).length;

  /**
   * Check if all classes have buildings assigned
   */
  const allClassesAssigned = totalClasses > 0 && assignedClassesCount === totalClasses;

  /**
   * Get filtered suggestions (exclude rejected)
   * Defensive check ensures suggestions is always an array
   */
  const activeSuggestions = Array.isArray(suggestions)
    ? suggestions.filter(
        (suggestion) => !rejectedSuggestions.includes(suggestion.blockId)
      )
    : [];

  /**
   * Check if user has completed onboarding
   * (uploaded schedule, assigned buildings, set preferences)
   */
  const hasCompletedOnboarding = schedule !== null && allClassesAssigned;

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Clear all user data (for logout or reset)
   */
  const clearUserData = useCallback(() => {
    setStudentId(INITIAL_STATE.studentId);
    setSchedule(INITIAL_STATE.schedule);
    setScheduleId(INITIAL_STATE.scheduleId);
    setBuildings(INITIAL_STATE.buildings);
    setSelectedBuildings(INITIAL_STATE.selectedBuildings);
    setSuggestions(INITIAL_STATE.suggestions);
    setAcceptedSuggestions(INITIAL_STATE.acceptedSuggestions);
    setRejectedSuggestions(INITIAL_STATE.rejectedSuggestions);
    setActivityPreferences(INITIAL_STATE.activityPreferences);
    setIsOnboarded(INITIAL_STATE.isOnboarded);
  }, []);

  /**
   * Update a single class's building assignment
   * 
   * @param {string} className - The class name (e.g., "CSCE 121-501")
   * @param {string} buildingId - The building ID (e.g., "zach")
   */
  const assignBuildingToClass = useCallback((className, buildingId) => {
    setSelectedBuildings((prev) => ({
      ...prev,
      [className]: buildingId,
    }));
  }, []);

  /**
   * Remove building assignment from a class
   * 
   * @param {string} className - The class name
   */
  const unassignBuildingFromClass = useCallback((className) => {
    setSelectedBuildings((prev) => {
      const newBuildings = { ...prev };
      delete newBuildings[className];
      return newBuildings;
    });
  }, []);

  /**
   * Accept a suggestion
   * 
   * @param {number|string} suggestionId - The suggestion ID or blockId
   */
  const acceptSuggestion = useCallback((suggestionId) => {
    setAcceptedSuggestions((prev) => {
      if (!prev.includes(suggestionId)) {
        return [...prev, suggestionId];
      }
      return prev;
    });
    // Remove from rejected if it was there
    setRejectedSuggestions((prev) => 
      prev.filter((id) => id !== suggestionId)
    );
  }, []);

  /**
   * Reject a suggestion
   * 
   * @param {number|string} suggestionId - The suggestion ID or blockId
   */
  const rejectSuggestion = useCallback((suggestionId) => {
    setRejectedSuggestions((prev) => {
      if (!prev.includes(suggestionId)) {
        return [...prev, suggestionId];
      }
      return prev;
    });
    // Remove from accepted if it was there
    setAcceptedSuggestions((prev) => 
      prev.filter((id) => id !== suggestionId)
    );
  }, []);

  /**
   * Update activity preferences
   * 
   * @param {object} preferences - Partial preferences to update
   */
  const updateActivityPreferences = useCallback((preferences) => {
    setActivityPreferences((prev) => ({
      ...prev,
      ...preferences,
    }));
  }, []);

  /**
   * Get building by ID
   * 
   * @param {string} buildingId - The building ID
   * @returns {object|null} Building object or null if not found
   */
  const getBuildingById = useCallback((buildingId) => {
    return buildings.find((building) => building.id === buildingId) || null;
  }, [buildings]);

  /**
   * Get building name by ID
   * 
   * @param {string} buildingId - The building ID
   * @returns {string} Building name or ID if not found
   */
  const getBuildingName = useCallback((buildingId) => {
    const building = getBuildingById(buildingId);
    return building ? building.name : buildingId;
  }, [getBuildingById]);

  // ========================================
  // DEBUG HELPERS
  // ========================================

  /**
   * Log current state to console (for debugging)
   */
  const debugState = useCallback(() => {
    console.log('=== UserContext State ===');
    console.log('Student ID:', studentId);
    console.log('Schedule:', schedule);
    console.log('Buildings:', buildings.length, 'total');
    console.log('Selected Buildings:', selectedBuildings);
    console.log('Suggestions:', suggestions.length, 'total');
    console.log('Accepted:', acceptedSuggestions);
    console.log('Rejected:', rejectedSuggestions);
    console.log('Preferences:', activityPreferences);
    console.log('Onboarded:', isOnboarded);
    console.log('========================');
  }, [studentId, schedule, buildings, selectedBuildings, suggestions, acceptedSuggestions, rejectedSuggestions, activityPreferences, isOnboarded]);

  // ========================================
  // EFFECTS
  // ========================================

  // Update onboarded status when data changes
  useEffect(() => {
    setIsOnboarded(hasCompletedOnboarding);
  }, [hasCompletedOnboarding]);

  // Log state changes in development
  useEffect(() => {
    if (__DEV__) {
      console.log('[UserContext] State updated');
    }
  }, [
    studentId,
    schedule,
    buildings,
    selectedBuildings,
    suggestions,
    activityPreferences,
  ]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  // Memoize context value to prevent unnecessary re-renders
  // Only recreate when actual dependencies change
  const value = useMemo(() => ({
    // Raw state
    studentId,
    schedule,
    scheduleId,
    buildings,
    selectedBuildings,
    suggestions,
    acceptedSuggestions,
    rejectedSuggestions,
    activityPreferences,
    isOnboarded,

    // Derived state
    totalClasses,
    assignedClassesCount,
    allClassesAssigned,
    activeSuggestions,
    hasCompletedOnboarding,

    // Setters (stable - from useState)
    setStudentId,
    setSchedule,
    setScheduleId,
    setBuildings,
    setSelectedBuildings,
    setSuggestions,
    setAcceptedSuggestions,
    setRejectedSuggestions,
    setActivityPreferences,
    setIsOnboarded,

    // Helper functions (memoized with useCallback)
    clearUserData,
    assignBuildingToClass,
    unassignBuildingFromClass,
    acceptSuggestion,
    rejectSuggestion,
    updateActivityPreferences,
    getBuildingById,
    getBuildingName,
    debugState,
  }), [
    // Dependencies - only recreate when these change
    studentId,
    schedule,
    scheduleId,
    buildings,
    selectedBuildings,
    suggestions,
    acceptedSuggestions,
    rejectedSuggestions,
    activityPreferences,
    isOnboarded,
    // Derived state
    totalClasses,
    assignedClassesCount,
    allClassesAssigned,
    activeSuggestions,
    hasCompletedOnboarding,
    // Memoized functions (stable references, but include for completeness)
    clearUserData,
    assignBuildingToClass,
    unassignBuildingFromClass,
    acceptSuggestion,
    rejectSuggestion,
    updateActivityPreferences,
    getBuildingById,
    getBuildingName,
    debugState,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * useUser Hook
 * 
 * Access user context in any component.
 * 
 * @returns {object} User context value
 * @throws {Error} If used outside UserProvider
 * 
 * @example
 * function MyScreen() {
 *   const { studentId, schedule, setSchedule } = useUser();
 *   
 *   if (!schedule) {
 *     return <Text>No schedule loaded</Text>;
 *   }
 *   
 *   return <Text>{schedule.classes.length} classes</Text>;
 * }
 */
export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UserContext;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Wrap app with provider (_layout.js)
 * 
 *   import { UserProvider } from '../contexts/UserContext';
 *   
 *   export default function RootLayout() {
 *     return (
 *       <UserProvider>
 *         <Stack>
 *           <Stack.Screen name="index" />
 *           <Stack.Screen name="home" />
 *         </Stack>
 *       </UserProvider>
 *     );
 *   }
 * 
 * 
 * Example 2: Use in file upload screen
 * 
 *   import { useUser } from '../contexts/UserContext';
 *   import * as api from '../services/api';
 *   
 *   function FileUploadScreen() {
 *     const { setStudentId, setSchedule, setScheduleId } = useUser();
 *     
 *     const handleUpload = async () => {
 *       const result = await api.uploadSchedule(fileContent, 'student_1');
 *       
 *       // Store in global state
 *       setStudentId('student_1');
 *       setSchedule(result.schedule);
 *       setScheduleId(result.scheduleId);
 *       
 *       // Navigate to next screen
 *       router.push('/buildingPicker');
 *     };
 *   }
 * 
 * 
 * Example 3: Use in building picker
 * 
 *   import { useUser } from '../contexts/UserContext';
 *   
 *   function BuildingPickerScreen() {
 *     const {
 *       schedule,
 *       buildings,
 *       assignBuildingToClass,
 *       allClassesAssigned
 *     } = useUser();
 *     
 *     return (
 *       <View>
 *         <Text>Assign buildings to {schedule.classes.length} classes</Text>
 *         {allClassesAssigned && <Text>All done!</Text>}
 *       </View>
 *     );
 *   }
 * 
 * 
 * Example 4: Use in schedule screen
 * 
 *   import { useUser } from '../contexts/UserContext';
 *   
 *   function ScheduleScreen() {
 *     const {
 *       schedule,
 *       activeSuggestions,
 *       acceptSuggestion,
 *       rejectSuggestion
 *     } = useUser();
 *     
 *     return (
 *       <View>
 *         {schedule.classes.map(renderClass)}
 *         {activeSuggestions.map(renderSuggestion)}
 *       </View>
 *     );
 *   }
 * 
 * 
 * Example 5: Debug state
 * 
 *   import { useUser } from '../contexts/UserContext';
 *   
 *   function DebugScreen() {
 *     const { debugState } = useUser();
 *     
 *     return (
 *       <Button title="Log State" onPress={debugState} />
 *     );
 *   }
 */

