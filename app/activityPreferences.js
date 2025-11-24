/**
 * Activity Preferences Screen
 * 
 * Allows users to set their activity preferences:
 * - Start of day (when to start looking for free time)
 * - End of day (when to stop looking for free time)
 * - Activity type (Exercise/Gym for MVP)
 * - Duration in minutes
 * 
 * ✅ BACKEND READY:
 * - POST /api/generate-suggestions endpoint is FUNCTIONAL and tested
 * - All Phase 1 & 2 complete, this screen has real backend integration!
 * 
 * Once generated, navigates to schedule screen with suggestions overlaid.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import * as api from '../services/api';
import { useUser } from '../contexts/UserContext';
import ErrorMessage from '../components/ErrorMessage';

/**
 * Convert 24-hour format to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM format (e.g., "08:00", "18:00")
 * @returns {string} Time in 12-hour format (e.g., "8:00 AM", "6:00 PM")
 */
const convert24To12Hour = (time24) => {
  if (!time24 || !time24.includes(':')) return time24;
  
  const [hours24, minutes] = time24.split(':');
  const hoursNum = parseInt(hours24, 10);
  
  if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 23) {
    return time24;  // Return as-is if invalid
  }
  
  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const hours12 = hoursNum === 0 ? 12 : hoursNum > 12 ? hoursNum - 12 : hoursNum;
  
  return `${hours12}:${minutes} ${period}`;
};

/**
 * Convert 12-hour format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "8:00 AM", "6:00 PM")
 * @returns {string} Time in HH:MM format (e.g., "08:00", "18:00")
 */
const convert12To24Hour = (time12) => {
  if (!time12) return time12;
  
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;  // Return as-is if doesn't match
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const hours24 = hours.toString().padStart(2, '0');
  return `${hours24}:${minutes}`;
};

export default function ActivityPreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Global state from UserContext
  const {
    studentId,
    activityPreferences,
    updateActivityPreferences,
    setSuggestions,
  } = useUser();

  // Form state - initialize from UserContext with 12-hour format conversion
  const [startOfDay, setStartOfDay] = useState(
    convert24To12Hour(activityPreferences.startOfDay)
  );
  const [endOfDay, setEndOfDay] = useState(
    convert24To12Hour(activityPreferences.endOfDay)
  );
  const [activityType, setActivityType] = useState(activityPreferences.activityType);
  const [duration, setDuration] = useState(activityPreferences.durationMinutes.toString());

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);

  /**
   * Validate time format (H:MM AM/PM or HH:MM AM/PM)
   */
  const validateTimeFormat = (time) => {
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    if (!timeRegex.test(time)) return false;
    
    const match = time.match(timeRegex);
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    return hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59;
  };

  /**
   * Convert time string to minutes since midnight for comparison
   */
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  /**
   * Validate all form inputs
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate start time format
    if (!validateTimeFormat(startOfDay)) {
      newErrors.startOfDay = 'Invalid format. Use H:MM AM/PM (e.g., 8:00 AM)';
    }

    // Validate end time format
    if (!validateTimeFormat(endOfDay)) {
      newErrors.endOfDay = 'Invalid format. Use H:MM AM/PM (e.g., 6:00 PM)';
    }

    // Validate end time is after start time
    if (validateTimeFormat(startOfDay) && validateTimeFormat(endOfDay)) {
      if (timeToMinutes(endOfDay) <= timeToMinutes(startOfDay)) {
        newErrors.endOfDay = 'End time must be after start time';
      }
    }

    // Validate duration
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 180) {
      newErrors.duration = 'Duration must be between 15 and 180 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle generate suggestions button
   * ✅ Uses Phase 4 API service and UserContext
   */
  const handleGenerate = async () => {
    // Validate form first
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fix the errors in the form before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGenerating(true);
    setErrors({});
    setError(null);

    try {
      const durationNum = parseInt(duration, 10);
      const currentStudentId = studentId || 'student_1';

      // Convert 12-hour format to 24-hour format for backend
      const startOfDay24 = convert12To24Hour(startOfDay);
      const endOfDay24 = convert12To24Hour(endOfDay);

      // Save preferences to UserContext (in 24-hour format for consistency)
      updateActivityPreferences({
        startOfDay: startOfDay24,
        endOfDay: endOfDay24,
        activityType,
        durationMinutes: durationNum,
      });

      // Generate suggestions using Phase 4 API service (with 24-hour format)
      const result = await api.generateSuggestions(
        currentStudentId,
        startOfDay24,
        endOfDay24,
        durationNum,
        activityType
      );

      // Store suggestions in UserContext
      if (result.success && result.suggestions) {
        // Validate that suggestions is an array before setting
        const suggestionsArray = Array.isArray(result.suggestions) 
          ? result.suggestions 
          : [];
        setSuggestions(suggestionsArray);

        // Log success for debugging
        console.log(`✅ Generated ${result.totalSuggestions} suggestion(s) across ${result.totalBlocks} time block(s)`);

        // Automatically navigate to schedule screen
        router.push('/schedule');
      } else {
        throw new Error('No suggestions generated. Try adjusting your preferences.');
      }

    } catch (err) {
      console.error('Generate suggestions error:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (isGenerating) {
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={isGenerating}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.light} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Activity Preferences</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="fitness-outline" size={48} color={Colors.primary} />
          <Text style={styles.instructionsTitle}>When do you want to work out?</Text>
          <Text style={styles.instructionsText}>
            Set your preferences and we'll find the perfect gym times that fit your schedule.
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            onRetry={handleGenerate}
          />
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Start of Day */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start of Day</Text>
            <Text style={styles.hint}>When to start looking for free time</Text>
            <TextInput
              style={[styles.input, errors.startOfDay && styles.inputError]}
              value={startOfDay}
              onChangeText={setStartOfDay}
              placeholder="8:00 AM"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="default"
              maxLength={8}
            />
            {errors.startOfDay && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errors.startOfDay}</Text>
              </View>
            )}
          </View>

          {/* End of Day */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End of Day</Text>
            <Text style={styles.hint}>When to stop looking for free time</Text>
            <TextInput
              style={[styles.input, errors.endOfDay && styles.inputError]}
              value={endOfDay}
              onChangeText={setEndOfDay}
              placeholder="6:00 PM"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="default"
              maxLength={8}
            />
            {errors.endOfDay && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errors.endOfDay}</Text>
              </View>
            )}
          </View>

          {/* Activity Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Type</Text>
            <Text style={styles.hint}>What kind of activity are you planning?</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={activityType}
                onValueChange={setActivityType}
                style={styles.picker}
              >
                <Picker.Item label="Exercise / Gym" value="exercise" />
                {/* Future: Add more activity types */}
              </Picker>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <Text style={styles.hint}>How long do you want to work out?</Text>
            <TextInput
              style={[styles.input, errors.duration && styles.inputError]}
              value={duration}
              onChangeText={setDuration}
              placeholder="60"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.duration && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errors.duration}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              We'll analyze your class schedule to find free time blocks between {startOfDay} and {endOfDay}. 
              Then we'll suggest the best gym based on walking distance from your classes.
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Set realistic time boundaries that match your daily schedule
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Include time for walking between classes and the gym
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              We recommend at least 60 minutes for a good workout
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Generate Button (Fixed at bottom) */}
      <View style={styles.generateContainer}>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.7}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color={Colors.text.light} style={styles.buttonLoader} />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color={Colors.text.light} />
              <Text style={styles.generateButtonText}>Generate Suggestions</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    width: 40,
  },

  // Content
  content: {
    padding: 20,
    paddingBottom: 120,
  },

  // Instructions
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 6,
  },

  // Picker
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceBlue,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Tips
  tipsContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Generate button
  generateContainer: {
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.light,
    marginLeft: 12,
  },
  buttonLoader: {
    marginRight: 12,
  },
});

