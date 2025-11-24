/**
 * API Service Layer
 * 
 * Centralized API client for AggieBuddie mobile app.
 * All backend communication should go through these functions.
 * 
 * Benefits:
 * - Single source of truth for API calls
 * - Consistent error handling
 * - Easy to add interceptors/middleware
 * - Better testability
 * - Cleaner component code
 * 
 * Usage:
 *   import * as api from '../services/api';
 *   
 *   const schedule = await api.uploadSchedule(fileContent, studentId);
 *   const buildings = await api.getBuildings();
 */

import { getApiUrl } from '../constants/ApiConfig';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const UPLOAD_TIMEOUT = 60000; // 60 seconds for file uploads

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enhanced fetch with timeout support
 * 
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 * @throws {Error} If request times out or fails
 */
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Handle API response and errors
 * 
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} If response is not ok
 */
async function handleResponse(response) {
  let data;
  
  try {
    data = await response.json();
  } catch (error) {
    // If response is not JSON, throw generic error
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error('Invalid response format from server');
  }

  if (!response.ok) {
    // Backend returned an error
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

/**
 * Create error message with helpful context
 * 
 * @param {Error} error - The error object
 * @param {string} context - Context about what operation failed
 * @returns {Error} Enhanced error with better message
 */
function createApiError(error, context) {
  // Network errors
  if (error.message.includes('Network request failed') || 
      error.message.includes('fetch')) {
    return new Error(
      `Cannot connect to backend server.\n\n` +
      `${context}\n\n` +
      `Troubleshooting:\n` +
      `• Make sure Flask server is running (python app.py)\n` +
      `• Check if you're on the same WiFi network\n` +
      `• Verify API_BASE_URL in ApiConfig.js\n` +
      `• See TROUBLESHOOTING_GUIDE.md for help`
    );
  }

  // Timeout errors
  if (error.message.includes('timed out')) {
    return new Error(
      `Request timed out.\n\n` +
      `${context}\n\n` +
      `The server took too long to respond. Please try again.`
    );
  }

  // Other errors - pass through with context
  return new Error(`${context}\n\nError: ${error.message}`);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Test backend connection
 * 
 * @returns {Promise<boolean>} True if backend is reachable
 * 
 * @example
 * const isUp = await api.testConnection();
 * if (!isUp) {
 *   alert('Backend is not running!');
 * }
 */
export async function testConnection() {
  try {
    const response = await fetchWithTimeout(
      getApiUrl('/api/health'),
      { method: 'GET' },
      5000 // 5 second timeout for health check
    );
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// ============================================================================
// SCHEDULE ENDPOINTS
// ============================================================================

/**
 * Upload ICS schedule file
 * 
 * @param {string} fileContent - The ICS file content as string
 * @param {string} studentId - The student's ID
 * @returns {Promise<object>} Response with parsed schedule
 * 
 * Response format:
 * {
 *   success: true,
 *   studentId: "student_1",
 *   schedule: {
 *     classes: [...],
 *     totalEvents: 94
 *   }
 * }
 * 
 * @throws {Error} If upload fails
 * 
 * @example
 * try {
 *   const result = await api.uploadSchedule(icsContent, 'student_1');
 *   console.log('Uploaded', result.schedule.totalEvents, 'events');
 * } catch (error) {
 *   alert(error.message);
 * }
 */
export async function uploadSchedule(fileContent, studentId) {
  // Validate and construct API URL
  const apiUrl = getApiUrl('/api/upload-schedule');
  
  // Critical validation: Ensure URL is properly formed
  if (!apiUrl || typeof apiUrl !== 'string') {
    const error = new Error(`API URL is invalid: ${apiUrl}. Check ApiConfig.js configuration.`);
    console.error('❌ [uploadSchedule] Invalid URL:', apiUrl);
    throw createApiError(error, 'Failed to upload schedule file. API configuration error.');
  }
  
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    const error = new Error(`API URL missing protocol: "${apiUrl}". Expected format: http://localhost:5000/api/upload-schedule`);
    console.error('❌ [uploadSchedule] Malformed URL:', apiUrl);
    console.error('❌ [uploadSchedule] Debug info:', {
      url: apiUrl,
      type: typeof apiUrl,
      length: apiUrl?.length
    });
    throw createApiError(error, 'Failed to upload schedule file. API URL is malformed. Check ApiConfig.js.');
  }
  
  console.log('📤 [uploadSchedule] Uploading to:', apiUrl);
  
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent,
          studentId,
        }),
      },
      UPLOAD_TIMEOUT // Longer timeout for file uploads
    );

    return await handleResponse(response);
  } catch (error) {
    console.error('❌ [uploadSchedule] Request failed:', error);
    console.error('❌ [uploadSchedule] URL used:', apiUrl);
    throw createApiError(error, 'Failed to upload schedule file.');
  }
}

/**
 * Get parsed schedule for a student
 * 
 * @param {string} studentId - The student's ID
 * @returns {Promise<object>} The student's schedule
 * 
 * @throws {Error} If retrieval fails
 * 
 * @example
 * const schedule = await api.getSchedule('student_1');
 * console.log('Classes:', schedule.classes);
 */
export async function getSchedule(studentId) {
  try {
    const response = await fetchWithTimeout(
      getApiUrl(`/api/schedule/${studentId}`),
      { method: 'GET' }
    );

    return await handleResponse(response);
  } catch (error) {
    throw createApiError(error, 'Failed to retrieve schedule.');
  }
}

// ============================================================================
// BUILDING ENDPOINTS
// ============================================================================

/**
 * Get list of all campus buildings
 * 
 * @returns {Promise<Array>} Array of building objects
 * 
 * Response format:
 * {
 *   success: true,
 *   count: 67,
 *   buildings: [
 *     {
 *       id: "zach",
 *       name: "Zachry Engineering Center",
 *       address: "3127 TAMU",
 *       type: "academic_building",
 *       coordinates: { lat: 30.6188, lng: -96.3410 }
 *     },
 *     ...
 *   ]
 * }
 * 
 * @throws {Error} If fetch fails
 * 
 * @example
 * const result = await api.getBuildings();
 * console.log('Found', result.buildings.length, 'buildings');
 */
export async function getBuildings() {
  try {
    const response = await fetchWithTimeout(
      getApiUrl('/api/buildings'),
      { method: 'GET' }
    );

    return await handleResponse(response);
  } catch (error) {
    throw createApiError(error, 'Failed to load campus buildings.');
  }
}

/**
 * Assign building locations to classes
 * 
 * @param {string} studentId - The student's ID
 * @param {object} locationMapping - Map of class names to building IDs
 * @returns {Promise<object>} Success response
 * 
 * @param locationMapping format:
 * {
 *   "CSCE 121-501": "zach",
 *   "MATH 251-201": "bloc",
 *   ...
 * }
 * 
 * Response format:
 * {
 *   success: true,
 *   message: "Buildings assigned to 94 classes",
 *   studentId: "student_1"
 * }
 * 
 * @throws {Error} If assignment fails
 * 
 * @example
 * const locations = {
 *   "CSCE 121-501": "zach",
 *   "MATH 251-201": "bloc"
 * };
 * await api.addLocations('student_1', locations);
 */
export async function addLocations(studentId, locationMapping) {
  try {
    const response = await fetchWithTimeout(
      getApiUrl('/api/schedule/add-locations'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          locations: locationMapping,
        }),
      }
    );

    return await handleResponse(response);
  } catch (error) {
    throw createApiError(error, 'Failed to save building assignments.');
  }
}

// ============================================================================
// SUGGESTION ENDPOINTS
// ============================================================================

/**
 * Generate activity suggestions for free time blocks
 * 
 * NOTE: This endpoint requires Phase 2.5 to be complete.
 * Currently NOT IMPLEMENTED in backend.
 * 
 * @param {string} studentId - The student's ID
 * @param {string} startOfDay - Start time (e.g., "08:00")
 * @param {string} endOfDay - End time (e.g., "18:00")
 * @param {number} durationMinutes - Desired activity duration
 * @param {string} activityType - Type of activity (default: "exercise")
 * @returns {Promise<object>} Response with suggestions
 * 
 * Response format:
 * {
 *   success: true,
 *   suggestions: [
 *     {
 *       blockId: 1,
 *       startTime: "2024-11-21T10:00:00",
 *       endTime: "2024-11-21T11:30:00",
 *       availableMinutes: 90,
 *       location: {
 *         id: "rec",
 *         name: "Student Recreation Center",
 *         type: "gym"
 *       },
 *       rank: 1,
 *       timeToLocation: 5,
 *       timeFromLocation: 8,
 *       score: 13,
 *       reasoning: "Excellent location - only 13 min total commute..."
 *     },
 *     ...
 *   ],
 *   totalBlocks: 2,
 *   totalSuggestions: 5
 * }
 * 
 * @throws {Error} If generation fails
 * 
 * @example
 * const result = await api.generateSuggestions('student_1', '08:00', '18:00', 60);
 * console.log('Generated', result.totalSuggestions, 'suggestions');
 */
export async function generateSuggestions(
  studentId,
  startOfDay,
  endOfDay,
  durationMinutes,
  activityType = 'exercise'
) {
  try {
    const response = await fetchWithTimeout(
      getApiUrl('/api/generate-suggestions'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          startOfDay,
          endOfDay,
          durationMinutes,
          activityType,
        }),
      },
      DEFAULT_TIMEOUT
    );

    return await handleResponse(response);
  } catch (error) {
    throw createApiError(error, 'Failed to generate activity suggestions.');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Health
  testConnection,

  // Schedule
  uploadSchedule,
  getSchedule,

  // Buildings
  getBuildings,
  addLocations,

  // Suggestions
  generateSuggestions,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Upload schedule and handle errors
 * 
 *   import * as api from '../services/api';
 *   
 *   try {
 *     setLoading(true);
 *     const result = await api.uploadSchedule(fileContent, 'student_1');
 *     console.log('Success!', result);
 *     navigation.navigate('BuildingPicker');
 *   } catch (error) {
 *     console.error(error);
 *     setError(error.message); // User-friendly error message
 *   } finally {
 *     setLoading(false);
 *   }
 * 
 * 
 * Example 2: Get buildings with fallback
 * 
 *   import * as api from '../services/api';
 *   
 *   try {
 *     const result = await api.getBuildings();
 *     setBuildings(result.buildings);
 *   } catch (error) {
 *     console.error(error);
 *     // Fallback to mock data
 *     setBuildings(MOCK_BUILDINGS);
 *   }
 * 
 * 
 * Example 3: Test connection before making requests
 * 
 *   import * as api from '../services/api';
 *   
 *   const isBackendUp = await api.testConnection();
 *   if (!isBackendUp) {
 *     alert('Backend server is not running. Please start it first.');
 *     return;
 *   }
 *   
 *   // Proceed with API calls...
 * 
 * 
 * Example 4: Generate suggestions
 * 
 *   import * as api from '../services/api';
 *   
 *   const result = await api.generateSuggestions(
 *     'student_1',
 *     '08:00',
 *     '18:00',
 *     60 // 60 minutes
 *   );
 *   
 *   setSuggestions(result.suggestions);
 */

