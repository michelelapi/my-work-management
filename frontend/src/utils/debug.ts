/**
 * Debugging utilities for React development
 * 
 * Usage:
 * import { debugLog, debugGroup, debugApi } from '../utils/debug';
 * 
 * debugLog('Component render', { props, state });
 * debugGroup('API Call', () => {
 *   debugLog('URL:', url);
 *   debugLog('Params:', params);
 * });
 */

// Environment check - only log in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Enhanced console.log that only works in development
 */
export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Enhanced console.error that only works in development
 */
export const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

/**
 * Enhanced console.warn that only works in development
 */
export const debugWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Grouped console logs for better organization
 */
export const debugGroup = (label: string, callback: () => void, collapsed: boolean = false) => {
  if (isDevelopment) {
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
    callback();
    console.groupEnd();
  }
};

/**
 * Log API requests and responses
 */
export const debugApi = {
  request: (method: string, url: string, data?: any, params?: any) => {
    if (isDevelopment) {
      debugGroup(`🚀 ${method.toUpperCase()} ${url}`, () => {
        if (params) debugLog('Query Params:', params);
        if (data) debugLog('Request Body:', data);
      }, true);
    }
  },
  
  response: (method: string, url: string, status: number, data?: any) => {
    if (isDevelopment) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      debugGroup(`${emoji} ${method.toUpperCase()} ${url} (${status})`, () => {
        debugLog('Response:', data);
      }, true);
    }
  },
  
  error: (method: string, url: string, error: any) => {
    if (isDevelopment) {
      debugGroup(`❌ ${method.toUpperCase()} ${url} - Error`, () => {
        debugError('Error:', error);
        if (error.response) {
          debugError('Status:', error.response.status);
          debugError('Data:', error.response.data);
        }
      });
    }
  }
};

/**
 * Measure execution time
 */
export const debugTime = (label: string) => {
  if (isDevelopment) {
    console.time(label);
    return () => console.timeEnd(label);
  }
  return () => {}; // No-op in production
};

/**
 * Log component render with props and state
 */
export const debugComponent = (componentName: string, props?: any, state?: any) => {
  if (isDevelopment) {
    debugGroup(`🔵 ${componentName} Render`, () => {
      if (props) debugLog('Props:', props);
      if (state) debugLog('State:', state);
    }, true);
  }
};

/**
 * Log state changes
 */
export const debugStateChange = (stateName: string, oldValue: any, newValue: any) => {
  if (isDevelopment) {
    debugGroup(`🔄 State Change: ${stateName}`, () => {
      debugLog('Old:', oldValue);
      debugLog('New:', newValue);
    }, true);
  }
};

/**
 * Table view for arrays/objects
 */
export const debugTable = (data: any, label?: string) => {
  if (isDevelopment) {
    if (label) console.log(label);
    console.table(data);
  }
};

/**
 * Assert with custom message
 */
export const debugAssert = (condition: boolean, message: string) => {
  if (isDevelopment && !condition) {
    console.error(`Assertion failed: ${message}`);
  }
};

