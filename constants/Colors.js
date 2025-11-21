/**
 * AggieBuddie Color System
 * 
 * ⚠️ CRITICAL: ABSOLUTELY NO PURPLE IN THIS APP ⚠️
 * 
 * This color palette is carefully designed for AggieBuddie.
 * Use only these approved colors throughout the application.
 * Purple is strictly forbidden for all UI elements.
 * 
 * USAGE GUIDELINES:
 * ================
 * 
 * Primary Actions:
 *   - Use Colors.primary for main buttons, active tabs
 *   - Use Colors.accent for highlights and links
 * 
 * Backgrounds:
 *   - Use Colors.background for main screen background
 *   - Use Colors.surface for cards and input fields
 *   - Use Colors.backgroundLight for light blue screens
 * 
 * Suggestions:
 *   - ALWAYS use Colors.suggestion.background for suggestion overlays
 *   - This ensures the transparent blue effect (NO PURPLE!)
 *   - Border with Colors.suggestion.border
 * 
 * Text:
 *   - Use Colors.text.primary for main content
 *   - Use Colors.text.secondary for labels and secondary info
 *   - Use Colors.text.tertiary for disabled/placeholder text
 * 
 * Feedback:
 *   - Use Colors.success for checkmarks, success states
 *   - Use Colors.error for errors, delete buttons
 *   - Use Colors.warning for warnings, cautions
 * 
 * EXAMPLE USAGE:
 * ==============
 * 
 * import Colors from '@/constants/Colors';
 * 
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: Colors.primary,
 *   },
 *   suggestionOverlay: {
 *     backgroundColor: Colors.suggestion.background,
 *     borderColor: Colors.suggestion.border,
 *   },
 * });
 * 
 * REMINDER: Check for purple before committing any changes!
 */

const Colors = {
  // ========================================
  // PRIMARY COLORS
  // ========================================
  
  // Primary Blue - Main brand color, buttons, active states
  primary: '#007AFF', // iOS Blue
  
  // Texas A&M Maroon - Secondary brand color
  maroon: '#500000',
  
  // Accent Blue - Highlights, links, active elements
  accent: '#00A3E0',
  accentLight: '#4D8DFF',
  
  // ========================================
  // BACKGROUND COLORS
  // ========================================
  
  background: '#FFFFFF',      // Main background
  backgroundLight: '#EFF3FF', // Light blue background
  surface: '#F5F5F5',         // Cards, input backgrounds
  surfaceBlue: '#E9F1FD',     // Light blue surface
  surfaceCard: '#CFE2FF',     // Card backgrounds
  
  // ========================================
  // SUGGESTION COLORS
  // ========================================
  
  suggestion: {
    // Transparent overlay for suggestion events
    background: 'rgba(0, 163, 224, 0.15)', // Light blue with 15% opacity
    border: '#00A3E0',                      // Accent blue border
    text: '#0E1C36',                        // Dark text for readability
  },
  
  // Accepted suggestion becomes solid
  accepted: {
    background: '#BDEAB5',  // Light green
    border: '#4CAF50',       // Success green
  },
  
  // ========================================
  // SEMANTIC COLORS
  // ========================================
  
  success: '#4CAF50',    // Green for success states, checkmarks
  error: '#F44336',      // Red for errors, delete actions
  warning: '#FF9800',    // Orange for warnings
  info: '#2196F3',       // Blue for info messages
  
  // ========================================
  // TEXT COLORS
  // ========================================
  
  text: {
    primary: '#000000',     // Main text
    secondary: '#666666',   // Secondary text, labels
    tertiary: '#999999',    // Disabled, placeholder text
    light: '#FFFFFF',       // Text on dark backgrounds
    dark: '#0E1C36',        // Dark text on light backgrounds
  },
  
  // ========================================
  // BORDER & DIVIDER COLORS
  // ========================================
  
  border: '#E0E0E0',       // Default borders
  divider: '#D6D6D6',      // Divider lines
};

export default Colors;

