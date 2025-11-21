/**
 * File Upload Screen
 * 
 * Allows users to upload their ICS (calendar) file to parse their class schedule.
 * 
 * PLATFORM SUPPORT:
 * - ✅ iOS: Uses expo-file-system for native file reading
 * - ✅ Android: Uses expo-file-system for native file reading
 * - ✅ Web: Uses File API for browser-based file reading
 * 
 * SETUP FOR MOBILE TESTING:
 * - Backend is READY! All endpoints are functional.
 * - Configure ApiConfig.js with your computer's IP address for mobile testing
 * - Make sure backend server is running: cd backend && python app.py
 * - Ensure mobile device and computer are on the same WiFi network
 * 
 * SETUP FOR WEB TESTING:
 * - Run: npm run web
 * - Backend: cd backend && python app.py
 * - Open browser to localhost:8081
 * 
 * See TROUBLESHOOTING_GUIDE.md for detailed setup instructions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
// Using legacy import to maintain compatibility with document picker URIs
// The new File API doesn't handle content:// URIs from document picker yet
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import * as api from '../services/api';
import { useUser } from '../contexts/UserContext';
import ErrorMessage from '../components/ErrorMessage';

export default function FileUploadScreen() {
  const router = useRouter();
  
  // Global state from UserContext
  const { setStudentId, setSchedule, setScheduleId } = useUser();
  
  // Local state management
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle file selection using document picker
   * Accepts .ics files (text/calendar MIME type)
   */
  const handleFilePicker = async () => {
    try {
      setError(null);
      
      // Open document picker for .ics files
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/calendar', // ICS file MIME type
        copyToCacheDirectory: true,
      });

      // Check if user cancelled
      if (result.canceled) {
        return;
      }

      // Get the selected file from document picker
      const selectedAsset = result.assets[0];
      
      // Validate file
      if (!selectedAsset.uri) {
        throw new Error('Invalid file selected');
      }

      // Check file extension
      if (!selectedAsset.name.toLowerCase().endsWith('.ics')) {
        setError('Please select a valid .ics calendar file');
        return;
      }

      // Store complete file information from document picker
      // Includes: uri (mobile), file (web), name, size, mimeType
      setSelectedFile(selectedAsset);

    } catch (err) {
      console.error('File picker error:', err);
      setError('Failed to select file. Please try again.');
    }
  };

  /**
   * Handle file upload to backend
   * 
   * ✅ BACKEND READY:
   * POST /api/upload-schedule endpoint is functional and tested
   * 
   * Process:
   * 1. Reads the ICS file content
   * 2. Sends to backend for parsing via api.uploadSchedule()
   * 3. Stores schedule in global UserContext
   * 4. Navigates to building picker on success
   * 
   * MOBILE SETUP:
   * Configure ApiConfig.js with your computer's IP address
   * See TROUBLESHOOTING_GUIDE.md for step-by-step instructions
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Read file content - platform-specific approach
      // Web: Uses File.text() API (standard Web API)
      // Mobile: Uses expo-file-system (native module)
      let fileContent;
      
      if (Platform.OS === 'web') {
        // Web platform: Use File API
        console.log('📄 Reading file on web platform');
        if (!selectedFile.file) {
          throw new Error('File object not available on web. Please try selecting the file again.');
        }
        fileContent = await selectedFile.file.text();
      } else {
        // Mobile platforms (iOS/Android): Use expo-file-system
        console.log('📄 Reading file on mobile platform');
        fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
      }
      
      if (!fileContent) {
        throw new Error('File is empty or could not be read');
      }
      
      console.log(`✅ File read successfully: ${fileContent.length} characters`);
      
      // Upload schedule using centralized API service
      const studentIdValue = 'student_1'; // TODO: Replace with actual user ID from auth
      const result = await api.uploadSchedule(fileContent, studentIdValue);

      // Store schedule data in global UserContext
      setStudentId(studentIdValue);
      setSchedule(result.schedule);
      setScheduleId(result.scheduleId || studentIdValue);

      // Success! Navigate to building picker
      router.push('/buildingPicker');

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload schedule. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (isUploading) {
      return; // Don't allow navigation during upload
    }
    router.back();
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={isUploading}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Upload Schedule</Text>
        
        {/* Submit button (top right) */}
        <TouchableOpacity
          onPress={handleUpload}
          disabled={!selectedFile || isUploading}
          style={[
            styles.submitButton,
            (!selectedFile || isUploading) && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!selectedFile || isUploading) && styles.submitButtonTextDisabled,
            ]}
          >
            Submit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Upload Your Class Schedule</Text>
          <Text style={styles.instructionsText}>
            Select your .ics calendar file exported from Howdy or your calendar app.
          </Text>
        </View>

        {/* Upload Area */}
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handleFilePicker}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <View style={styles.uploadContent}>
            {selectedFile ? (
              // File selected view
              <>
                <Ionicons name="document-text" size={64} color={Colors.success} />
                <Text style={styles.uploadText}>{selectedFile.name}</Text>
                <Text style={styles.uploadSubtext}>
                  {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Size unknown'}
                </Text>
                <TouchableOpacity
                  onPress={handleClearFile}
                  style={styles.changeFileButton}
                  disabled={isUploading}
                >
                  <Text style={styles.changeFileButtonText}>Change File</Text>
                </TouchableOpacity>
              </>
            ) : (
              // No file selected view
              <>
                <Ionicons name="cloud-upload-outline" size={64} color={Colors.accent} />
                <Text style={styles.uploadText}>Tap to select your .ics file</Text>
                <Text style={styles.uploadSubtext}>or drag and drop</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {isUploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Uploading and parsing schedule...</Text>
            <Text style={styles.loadingSubtext}>This may take a moment</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            onRetry={selectedFile ? handleUpload : null}
          />
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>How to get your .ics file:</Text>
          <Text style={styles.helpText}>
            1. Go to Howdy → My Record → My Calendar{'\n'}
            2. Click "Export" or "Download"{'\n'}
            3. Save the .ics file{'\n'}
            4. Return here and upload it
          </Text>
        </View>

        {/* Development Note */}
        <View style={styles.devNoteContainer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
          <Text style={styles.devNoteText}>
            <Text style={styles.devNoteBold}>Development Note: </Text>
            Upload functionality requires backend Phase 1 (ScheduleService) and Phase 2.2 
            (upload endpoint) to be complete. UI is ready for testing.
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
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  submitButtonText: {
    color: Colors.text.light,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: Colors.text.tertiary,
  },

  // Content styles
  content: {
    padding: 20,
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

  // Upload area
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    backgroundColor: Colors.backgroundLight,
    marginBottom: 20,
  },
  uploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  changeFileButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.accent,
    borderRadius: 8,
  },
  changeFileButtonText: {
    color: Colors.text.light,
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surfaceBlue,
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
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

  // Help
  helpContainer: {
    backgroundColor: Colors.surfaceBlue,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Development note
  devNoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
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
});

