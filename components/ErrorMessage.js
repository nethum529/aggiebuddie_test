/**
 * ErrorMessage Component
 * 
 * Reusable error display component with consistent styling.
 * Shows user-friendly error messages with dismiss and retry actions.
 * 
 * Features:
 * - Consistent error styling across the app
 * - Optional retry button
 * - Dismissable
 * - Icon support
 * - Multi-line message support
 * - Accessible
 * 
 * Usage:
 *   import ErrorMessage from '../components/ErrorMessage';
 *   
 *   <ErrorMessage
 *     message="Failed to load data"
 *     onDismiss={() => setError(null)}
 *     onRetry={fetchData}
 *   />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

/**
 * ErrorMessage Component
 * 
 * @param {object} props - Component props
 * @param {string} props.message - The error message to display
 * @param {function} props.onDismiss - Callback when dismiss button is pressed
 * @param {function} props.onRetry - Optional callback for retry action
 * @param {string} props.title - Optional error title (default: "Error")
 * @param {string} props.icon - Optional icon name (default: "alert-circle")
 * @param {object} props.style - Optional container style
 * @param {boolean} props.showIcon - Whether to show icon (default: true)
 */
export default function ErrorMessage({
  message,
  onDismiss,
  onRetry,
  title = 'Error',
  icon = 'alert-circle',
  style,
  showIcon = true,
}) {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        {showIcon && (
          <Ionicons
            name={icon}
            size={24}
            color={Colors.error}
            style={styles.icon}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * NetworkErrorMessage Component
 * 
 * Specialized error for network/backend connection issues.
 * 
 * @param {object} props - Component props
 * @param {function} props.onDismiss - Callback when dismiss button is pressed
 * @param {function} props.onRetry - Optional callback for retry action
 */
export function NetworkErrorMessage({ onDismiss, onRetry }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message={
        'Cannot connect to backend server.\n\n' +
        'Please check:\n' +
        '• Backend server is running\n' +
        '• You are on the same WiFi network\n' +
        '• API configuration in ApiConfig.js'
      }
      icon="cloud-offline"
      onDismiss={onDismiss}
      onRetry={onRetry}
    />
  );
}

/**
 * ValidationErrorMessage Component
 * 
 * Specialized error for validation issues.
 * 
 * @param {object} props - Component props
 * @param {string} props.message - The validation error message
 * @param {function} props.onDismiss - Callback when dismiss button is pressed
 */
export function ValidationErrorMessage({ message, onDismiss }) {
  return (
    <ErrorMessage
      title="Validation Error"
      message={message}
      icon="alert-circle-outline"
      onDismiss={onDismiss}
    />
  );
}

/**
 * InfoMessage Component
 * 
 * Similar to ErrorMessage but for informational messages.
 * 
 * @param {object} props - Component props
 * @param {string} props.message - The info message to display
 * @param {function} props.onDismiss - Callback when dismiss button is pressed
 * @param {string} props.title - Optional title (default: "Info")
 */
export function InfoMessage({ message, onDismiss, title = 'Info' }) {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.container, styles.infoContainer]}>
      <View style={styles.header}>
        <Ionicons
          name="information-circle"
          size={24}
          color={Colors.info}
          style={styles.icon}
        />
        <Text style={[styles.title, styles.infoTitle]}>{title}</Text>
      </View>

      <Text style={[styles.message, styles.infoMessage]}>{message}</Text>

      {onDismiss && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Got it</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * SuccessMessage Component
 * 
 * Similar to ErrorMessage but for success messages.
 * 
 * @param {object} props - Component props
 * @param {string} props.message - The success message to display
 * @param {function} props.onDismiss - Callback when dismiss button is pressed
 * @param {string} props.title - Optional title (default: "Success")
 */
export function SuccessMessage({ message, onDismiss, title = 'Success' }) {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.container, styles.successContainer]}>
      <View style={styles.header}>
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={Colors.success}
          style={styles.icon}
        />
        <Text style={[styles.title, styles.successTitle]}>{title}</Text>
      </View>

      <Text style={[styles.message, styles.successMessage]}>{message}</Text>

      {onDismiss && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorBackground,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  message: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  retryButton: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: Colors.surface,
  },
  dismissText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Info variant
  infoContainer: {
    backgroundColor: Colors.backgroundLight,
    borderColor: Colors.info,
  },
  infoTitle: {
    color: Colors.info,
  },
  infoMessage: {
    color: Colors.text.primary,
  },

  // Success variant
  successContainer: {
    backgroundColor: Colors.successBackground,
    borderColor: Colors.success,
  },
  successTitle: {
    color: Colors.success,
  },
  successMessage: {
    color: Colors.text.primary,
  },
});

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic error message
 * 
 *   const [error, setError] = useState(null);
 *   
 *   return (
 *     <View>
 *       <ErrorMessage
 *         message={error}
 *         onDismiss={() => setError(null)}
 *       />
 *     </View>
 *   );
 * 
 * 
 * Example 2: Error with retry
 * 
 *   const [error, setError] = useState(null);
 *   
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getBuildings();
 *     } catch (err) {
 *       setError(err.message);
 *     }
 *   };
 *   
 *   return (
 *     <ErrorMessage
 *       message={error}
 *       onDismiss={() => setError(null)}
 *       onRetry={fetchData}
 *     />
 *   );
 * 
 * 
 * Example 3: Network error
 * 
 *   <NetworkErrorMessage
 *     onDismiss={() => setError(null)}
 *     onRetry={fetchData}
 *   />
 * 
 * 
 * Example 4: Success message
 * 
 *   const [success, setSuccess] = useState(null);
 *   
 *   return (
 *     <SuccessMessage
 *       message="Schedule uploaded successfully!"
 *       onDismiss={() => setSuccess(null)}
 *     />
 *   );
 * 
 * 
 * Example 5: Info message
 * 
 *   <InfoMessage
 *     title="Getting Started"
 *     message="Upload your .ics schedule file to get started."
 *     onDismiss={() => setShowInfo(false)}
 *   />
 */

