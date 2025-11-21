/**
 * Event Detail Screen
 * 
 * Shows detailed information about a schedule event or accepted suggestion.
 * 
 * Features:
 * - Event title, time, and location
 * - Notes section with editing capability
 * - Back button navigation
 * - Clean, readable layout
 * 
 * Integration:
 * - Receives event data via navigation params
 * - Can be enhanced with UserContext for saving notes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Event data from navigation params
  const eventId = params.eventId || 'unknown';
  const title = params.title || 'Event';
  const start = params.start || '';
  const end = params.end || '';
  const location = params.location || 'TBD';
  
  // Notes state
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  /**
   * Format time for display
   */
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = ((hours + 11) % 12) + 1;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Handle save notes
   */
  const handleSaveNotes = () => {
    // TODO: Save notes to UserContext or backend
    setIsEditingNotes(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.light} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Event Details</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Title */}
        <View style={styles.section}>
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.eventTitle}>{title}</Text>
          </View>
        </View>

        {/* Time */}
        {start && end && (
          <View style={styles.section}>
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={24} color={Colors.accent} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>
                  {formatTime(start)} - {formatTime(end)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={24} color={Colors.maroon} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{location}</Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text-outline" size={24} color={Colors.info} />
              </View>
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            
            {!isEditingNotes ? (
              <TouchableOpacity
                onPress={() => setIsEditingNotes(true)}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSaveNotes}
                style={styles.saveButton}
              >
                <Ionicons name="checkmark" size={20} color={Colors.success} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingNotes ? (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this event..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.notesDisplay}>
              {notes ? (
                <Text style={styles.notesText}>{notes}</Text>
              ) : (
                <Text style={styles.notesPlaceholder}>
                  No notes yet. Tap "Edit" to add some!
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Tip: </Text>
            Add notes to remember important details about your events,  like homework, equipment needed, or meeting topics.
          </Text>
        </View>
      </ScrollView>
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
    width: 40,
  },

  // Content
  content: {
    padding: 20,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },

  // Event title
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },

  // Labels and values
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Notes section
  notesSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accepted.background,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 4,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 120,
  },
  notesDisplay: {
    minHeight: 80,
  },
  notesText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  notesPlaceholder: {
    fontSize: 16,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  infoBold: {
    fontWeight: '600',
    color: Colors.info,
  },
});

