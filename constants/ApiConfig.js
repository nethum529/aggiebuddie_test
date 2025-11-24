/**
 * API Configuration
 * 
 * Centralized API endpoint configuration for AggieBuddie mobile app.
 * 
 * ⚠️ IMPORTANT FOR MOBILE TESTING:
 * When testing on a mobile device, you CANNOT use 'localhost' - the mobile
 * device will try to connect to itself! You must use your computer's local
 * network IP address instead.
 * 
 * HOW TO CONFIGURE FOR MOBILE TESTING:
 * 
 * 1. Find your computer's local IP address:
 *    
 *    Windows (Command Prompt):
 *      > ipconfig
 *      Look for "Wireless LAN adapter Wi-Fi"
 *      Find "IPv4 Address" (e.g., 192.168.1.100)
 *    
 *    Mac/Linux (Terminal):
 *      $ ifconfig
 *      Look for "en0" or "wlan0"
 *      Find "inet" address (e.g., 192.168.1.100)
 * 
 * 2. Change USE_LOCALHOST below to false
 * 
 * 3. Update LOCAL_IP with your computer's IP address
 * 
 * 4. Make sure backend server is running:
 *    cd aggie-buddie/backend
 *    python app.py
 * 
 * 5. Verify both devices are on the same WiFi network!
 */

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================================================

/**
 * Set to true for web browser testing (http://localhost:5000)
 * Set to false for mobile device testing (http://YOUR_IP:5000)
 */
const USE_LOCALHOST = true;

/**
 * Your computer's local network IP address
 * 
 * Find this by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
 * 
 * Example: '192.168.1.100' or '10.0.0.50'
 * 
 * ⚠️ MUST UPDATE THIS for mobile testing to work!
 */
const LOCAL_IP = '192.168.1.100';  // ← CHANGE THIS to your IP!

/**
 * Backend server port
 * Default: 5000 (Flask development server)
 */
const PORT = 5000;

// ============================================================================
// API BASE URL CONSTRUCTION
// ============================================================================

/**
 * Constructs the base URL based on configuration
 * 
 * Returns:
 *   - http://localhost:5000 if USE_LOCALHOST is true
 *   - http://YOUR_IP:5000 if USE_LOCALHOST is false
 */
const API_BASE_URL = (() => {
  if (USE_LOCALHOST) {
    return `http://localhost:${PORT}`;
  } else {
    return `http://${LOCAL_IP}:${PORT}`;
  }
})();

// Debug: Log the constructed URL (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('🔧 [ApiConfig] API_BASE_URL:', API_BASE_URL);
  console.log('🔧 [ApiConfig] USE_LOCALHOST:', USE_LOCALHOST);
  console.log('🔧 [ApiConfig] PORT:', PORT);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the full API URL for a specific endpoint
 * 
 * @param {string} endpoint - The API endpoint path (e.g., '/api/health')
 * @returns {string} Full URL (e.g., 'http://192.168.1.100:5000/api/health')
 * 
 * @example
 * const url = getApiUrl('/api/upload-schedule');
 * // Returns: 'http://192.168.1.100:5000/api/upload-schedule'
 */
export function getApiUrl(endpoint) {
  // Remove leading slash if present (we'll add it)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Ensure API_BASE_URL is valid
  if (!API_BASE_URL || API_BASE_URL.trim() === '') {
    console.error('❌ [ApiConfig] API_BASE_URL is empty!', {
      USE_LOCALHOST,
      LOCAL_IP,
      PORT,
      API_BASE_URL
    });
    // Fallback to localhost
    return `http://localhost:5000${cleanEndpoint}`;
  }
  
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
  
  // Debug logging in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('🔧 [ApiConfig] getApiUrl:', fullUrl);
  }
  
  return fullUrl;
}

/**
 * Test if the backend is reachable
 * 
 * @returns {Promise<boolean>} True if backend responds, false otherwise
 * 
 * @example
 * const isBackendUp = await testBackendConnection();
 * if (!isBackendUp) {
 *   console.log('Backend server is not running!');
 * }
 */
export async function testBackendConnection() {
  try {
    const response = await fetch(getApiUrl('/api/health'), {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    });
    return response.ok; // Returns true if status 200-299
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
}

/**
 * Get configuration information for debugging
 * 
 * @returns {object} Current configuration details
 * 
 * @example
 * console.log('API Config:', getConfigInfo());
 */
export function getConfigInfo() {
  return {
    useLocalhost: USE_LOCALHOST,
    localIP: LOCAL_IP,
    port: PORT,
    baseUrl: API_BASE_URL,
    example: getApiUrl('/api/health'),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Configuration values
  USE_LOCALHOST,
  LOCAL_IP,
  PORT,
  API_BASE_URL,
  
  // Helper functions
  getApiUrl,
  testBackendConnection,
  getConfigInfo,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Simple endpoint call
 * 
 *   import { getApiUrl } from '../constants/ApiConfig';
 *   
 *   const response = await fetch(getApiUrl('/api/upload-schedule'), {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ... }),
 *   });
 * 
 * Example 2: Using the base URL directly
 * 
 *   import ApiConfig from '../constants/ApiConfig';
 *   
 *   const healthUrl = `${ApiConfig.API_BASE_URL}/api/health`;
 *   const response = await fetch(healthUrl);
 * 
 * Example 3: Test connection before making requests
 * 
 *   import { testBackendConnection, getApiUrl } from '../constants/ApiConfig';
 *   
 *   const isConnected = await testBackendConnection();
 *   if (isConnected) {
 *     const response = await fetch(getApiUrl('/api/upload-schedule'), ...);
 *   } else {
 *     alert('Cannot connect to backend. Is the server running?');
 *   }
 * 
 * Example 4: Debug configuration
 * 
 *   import { getConfigInfo } from '../constants/ApiConfig';
 *   
 *   console.log('Current API Configuration:', getConfigInfo());
 *   // Outputs:
 *   // {
 *   //   useLocalhost: false,
 *   //   localIP: '192.168.1.100',
 *   //   port: 5000,
 *   //   baseUrl: 'http://192.168.1.100:5000',
 *   //   example: 'http://192.168.1.100:5000/api/health'
 *   // }
 */

