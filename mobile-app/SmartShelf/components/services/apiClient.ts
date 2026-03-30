import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants/api';

/**
 * Production-ready Axios instance for SmartShelf
 * Optimized for React Native / Expo
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Request Interceptor: Handles async token retrieval and injection
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // 1. Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (token) {
        // 2. Attach token to Authorization header using Bearer scheme
        // Using .set() is the most robust way in Axios 1.x
        if (config.headers.set) {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 3. Debug logging for development
        if (__DEV__) {
          console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
          console.log(`🔑 Token Attached: Bearer ${token.substring(0, 10)}...`);
        }
      } else {
        if (__DEV__) {
          console.log(`📤 [API Request] ${config.method?.toUpperCase()} ${config.url} (No Token Found)`);
        }
      }

      return config;
    } catch (error) {
      console.error('❌ [API Client] Request Error:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles global error states like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ [API Response] ${response.status} - ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const { response, config, message } = error;

    // Extract backend error message if available
    let backendMessage = (response?.data as any)?.message || message;

    // Detect HTML responses (typical for ngrok/tunnel global errors)
    const isHtmlResponse = typeof response?.data === 'string' && 
                          ((response.data as string).includes('<!DOCTYPE html>') || (response.data as string).includes('<html'));

    if (isHtmlResponse) {
      const dataStr = response?.data as string;
      if (dataStr.includes('ERR_NGROK_3200') || dataStr.includes('offline')) {
        backendMessage = "API Tunnel Offline (ngrok). Please ensure your tunnel agent is running.";
      } else if (dataStr.includes('tunnel error') || dataStr.includes('502')) {
        backendMessage = "Tunnel Gateway Error. The tunnel is up but the backend server might be down.";
      } else {
        backendMessage = "Unexpected HTML response from server (possible tunnel/proxy error).";
      }
    }

    // Treat 4xx as warnings (to avoid Red Box in DEV) 
    // Treat 5xx and network errors as errors
    if (response?.status && response.status >= 400 && response.status < 500) {
      if (__DEV__) {
        // Special case: 401 is usually just a session expiry, don't use warn/error to avoid spam
        if (response.status === 401) {
          console.log(`ℹ️ [API Client] 401 Unauthorized: ${config?.url}`);
        } else {
          console.warn(`⚠️ [API Client Warning] ${config?.method?.toUpperCase()} ${config?.url} | ${response.status}: ${backendMessage}`);
        }
      }
    } else {
      const fullUrl = config?.baseURL ? `${config.baseURL}${config.url}` : config?.url;
      console.error(`🚨 [API Client Error] URL: ${fullUrl} | MSG: ${backendMessage} | STATUS: ${response?.status || 'Network Error'}`);
      
      if (!response && !message.includes('timeout')) {
        console.log(`💡 [Tip] If this is a Network Error, ensure your backend server at ${config?.baseURL} is running and reachable from your device.`);
      } else if (isHtmlResponse) {
        console.log(`💡 [Tip] Received an HTML error page. This usually means the request was blocked by ngrok or a proxy before reaching your backend.`);
      }
    }

    // Handle 401 Unauthorized globally
    if (response?.status === 401) {
      if (__DEV__) {
        console.log(`🌀 [API Client] Session expired or invalid at ${config?.url}. Clearing storage...`);
      }

      // Clear all authentication data to force a re-login
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
        if (__DEV__) console.log('🌀 [API Client] Storage cleared successfully.');
      } catch (storageError) {
        // This often happens if the device is out of space (disk full)
        console.error('⚠️ [API Client] Failed to clear storage on 401 (Disk might be full):', storageError);
        
        // CRITICAL: We don't want to get stuck in a loop. 
        // We've already tried to clear it; even if it fails, we should proceed
        // and let the app's internal state handle the logout or redirection.
      }

      // Note: The app's root layout (_layout.tsx) will detect the missing user/token
      // and handle the redirection to the Login screen automatically.
    }

    return Promise.reject(error);
  }
);

export default apiClient;