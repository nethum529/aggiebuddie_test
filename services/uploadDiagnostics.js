/**
 * Upload Diagnostics Service
 * 
 * Comprehensive diagnostic tool for file upload issues.
 * Tests each component of the upload flow independently.
 * 
 * Usage:
 *   import { UploadDiagnostics } from '../services/uploadDiagnostics';
 *   
 *   const report = await UploadDiagnostics.runFullDiagnostic();
 *   console.log(report);
 */

import { Platform } from 'react-native';
import { getApiUrl, getConfigInfo } from '../constants/ApiConfig';
import * as api from './api';

export class UploadDiagnostics {
  /**
   * Run complete diagnostic suite
   * 
   * @returns {Promise<object>} Full diagnostic report
   */
  static async runFullDiagnostic() {
    const timestamp = new Date().toISOString();
    const results = {
      timestamp,
      overall: 'pass',
      tests: {},
      recommendations: [],
      nextSteps: []
    };

    // Test 1: API Configuration
    console.log('🔍 [Diagnostic] Testing API Configuration...');
    results.tests.config = await this.testApiConfiguration();
    if (!results.tests.config.success) {
      results.overall = 'fail';
      results.recommendations.push('Fix API configuration issues');
    }

    // Test 2: Backend Connection
    console.log('🔍 [Diagnostic] Testing Backend Connection...');
    results.tests.backend = await this.testBackendConnection();
    if (!results.tests.backend.success) {
      results.overall = 'fail';
      results.recommendations.push('Start backend server: cd backend && python app.py');
      results.nextSteps.push('Verify backend is running at: ' + results.tests.config.constructedUrl);
    }

    // Test 3: Network Connectivity
    console.log('🔍 [Diagnostic] Testing Network Connectivity...');
    results.tests.network = await this.testNetworkConnectivity();
    if (!results.tests.network.success) {
      results.overall = results.overall === 'pass' ? 'warning' : 'fail';
      results.recommendations.push('Check network connection and firewall settings');
    }

    // Generate recommendations
    if (results.overall === 'pass') {
      results.recommendations.push('All systems operational - upload should work');
    } else {
      results.nextSteps.push('Run diagnostics again after fixing issues');
      results.nextSteps.push('Check console logs for detailed error information');
    }

    return results;
  }

  /**
   * Test API configuration
   * 
   * @returns {Promise<object>} Configuration test results
   */
  static async testApiConfiguration() {
    try {
      const config = getConfigInfo();
      const testUrl = getApiUrl('/api/health');
      
      const issues = [];
      
      // Check if URL is valid
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        issues.push('Invalid URL format');
      }

      // Check if localhost is used on mobile
      if (Platform.OS !== 'web' && config.baseUrl.includes('localhost')) {
        issues.push('localhost cannot be used on mobile - use IP address');
      }

      // Check if IP is set for mobile
      if (Platform.OS !== 'web' && !config.useLocalhost && config.localIP === '192.168.1.100') {
        issues.push('LOCAL_IP appears to be placeholder - update with your actual IP');
      }

      return {
        success: issues.length === 0,
        config: {
          useLocalhost: config.useLocalhost,
          localIP: config.localIP,
          port: config.port,
          baseUrl: config.baseUrl
        },
        constructedUrl: testUrl,
        platform: Platform.OS,
        issues: issues,
        recommendations: issues.length > 0 ? [
          'Update ApiConfig.js with correct configuration',
          'For mobile: Set USE_LOCALHOST = false and update LOCAL_IP',
          'For web: Set USE_LOCALHOST = true'
        ] : []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        issues: ['Failed to read configuration']
      };
    }
  }

  /**
   * Test backend connection
   * 
   * @returns {Promise<object>} Connection test results
   */
  static async testBackendConnection() {
    const startTime = Date.now();
    
    try {
      const healthUrl = getApiUrl('/api/health');
      console.log('🔍 [Diagnostic] Testing:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          success: false,
          url: healthUrl,
          responseTime,
          status: response.status,
          statusText: response.statusText,
          error: `Backend returned status ${response.status}`,
          recommendation: 'Check backend server logs for errors'
        };
      }

      const data = await response.json();
      
      // Check if all services are initialized
      const servicesReady = data.all_services_ready || false;
      const services = data.services || {};

      return {
        success: true,
        url: healthUrl,
        responseTime,
        status: response.status,
        services: services,
        allServicesReady: servicesReady,
        message: data.message || 'Backend is healthy',
        warnings: servicesReady ? [] : ['Some backend services may not be initialized']
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthUrl = getApiUrl('/api/health');
      
      let errorType = 'Unknown error';
      let recommendation = 'Check backend server status';
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorType = 'Connection timeout';
        recommendation = 'Backend server may be slow or not responding. Check if server is running.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        errorType = 'Network error';
        recommendation = 'Cannot reach backend. Check: 1) Server is running, 2) Correct IP address, 3) Same WiFi network (mobile)';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
        errorType = 'Connection refused';
        recommendation = 'Backend server is not running. Start it with: cd backend && python app.py';
      }

      return {
        success: false,
        url: healthUrl,
        responseTime,
        error: errorType,
        errorDetails: error.message,
        recommendation: recommendation
      };
    }
  }

  /**
   * Test network connectivity
   * 
   * @returns {Promise<object>} Network test results
   */
  static async testNetworkConnectivity() {
    try {
      const config = getConfigInfo();
      const testUrl = getApiUrl('/api/health');
      
      // Extract hostname and port from URL
      const urlObj = new URL(testUrl);
      const hostname = urlObj.hostname;
      const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

      // Simple connectivity test
      const startTime = Date.now();
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD', // Just check if server responds
          signal: AbortSignal.timeout(3000)
        });
        const latency = Date.now() - startTime;
        
        return {
          success: true,
          reachable: true,
          hostname,
          port,
          latency,
          message: `Server is reachable (${latency}ms)`
        };
      } catch (error) {
        const latency = Date.now() - startTime;
        return {
          success: false,
          reachable: false,
          hostname,
          port,
          latency,
          error: error.message,
          recommendation: 'Check firewall settings and network configuration'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendation: 'Network test failed - check configuration'
      };
    }
  }

  /**
   * Test file reading capability
   * 
   * @param {object} file - File object from document picker
   * @returns {Promise<object>} File reading test results
   */
  static async testFileReading(file) {
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
        recommendation: 'Select a file first'
      };
    }

    try {
      const platform = Platform.OS;
      
      if (platform === 'web') {
        if (!file.file) {
          return {
            success: false,
            platform: 'web',
            error: 'File object not available',
            recommendation: 'Try selecting the file again'
          };
        }
        
        // Test reading on web
        const content = await file.file.text();
        return {
          success: true,
          platform: 'web',
          fileSize: file.size || 0,
          contentLength: content.length,
          message: 'File reading works on web platform'
        };
      } else {
        // Mobile platform
        if (!file.uri) {
          return {
            success: false,
            platform,
            error: 'File URI not available',
            recommendation: 'Try selecting the file again'
          };
        }

        // Import FileSystem dynamically to avoid issues
        const FileSystem = require('expo-file-system/legacy');
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        return {
          success: true,
          platform,
          fileSize: file.size || 0,
          contentLength: content.length,
          message: 'File reading works on mobile platform'
        };
      }
    } catch (error) {
      return {
        success: false,
        platform: Platform.OS,
        error: error.message,
        recommendation: 'Check file permissions and format'
      };
    }
  }

  /**
   * Format diagnostic report for display
   * 
   * @param {object} report - Diagnostic report
   * @returns {string} Formatted report text
   */
  static formatReport(report) {
    let text = `Diagnostic Report - ${new Date(report.timestamp).toLocaleString()}\n\n`;
    text += `Overall Status: ${report.overall.toUpperCase()}\n\n`;

    // Configuration Test
    text += `API Configuration:\n`;
    if (report.tests.config) {
      text += `  Status: ${report.tests.config.success ? '✅ PASS' : '❌ FAIL'}\n`;
      text += `  URL: ${report.tests.config.constructedUrl}\n`;
      text += `  Platform: ${report.tests.config.platform}\n`;
      if (report.tests.config.issues.length > 0) {
        text += `  Issues: ${report.tests.config.issues.join(', ')}\n`;
      }
    }
    text += `\n`;

    // Backend Test
    text += `Backend Connection:\n`;
    if (report.tests.backend) {
      text += `  Status: ${report.tests.backend.success ? '✅ PASS' : '❌ FAIL'}\n`;
      if (report.tests.backend.success) {
        text += `  Response Time: ${report.tests.backend.responseTime}ms\n`;
        text += `  Services Ready: ${report.tests.backend.allServicesReady ? 'Yes' : 'No'}\n`;
      } else {
        text += `  Error: ${report.tests.backend.error}\n`;
        text += `  Recommendation: ${report.tests.backend.recommendation}\n`;
      }
    }
    text += `\n`;

    // Network Test
    text += `Network Connectivity:\n`;
    if (report.tests.network) {
      text += `  Status: ${report.tests.network.success ? '✅ PASS' : '❌ FAIL'}\n`;
      if (report.tests.network.success) {
        text += `  Latency: ${report.tests.network.latency}ms\n`;
      } else {
        text += `  Error: ${report.tests.network.error}\n`;
      }
    }
    text += `\n`;

    // Recommendations
    if (report.recommendations.length > 0) {
      text += `Recommendations:\n`;
      report.recommendations.forEach((rec, i) => {
        text += `  ${i + 1}. ${rec}\n`;
      });
      text += `\n`;
    }

    return text;
  }
}

export default UploadDiagnostics;

