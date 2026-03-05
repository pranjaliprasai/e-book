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

    // Log network/timeout errors loudly
    console.error(`🚨 [API Client Error] URL: ${config?.url} | MSG: ${message} | STATUS: ${response?.status}`);

    // Handle 401 Unauthorized globally
    if (response?.status === 401) {
      console.error(`🛑 [API Client] 401 Unauthorized at ${config?.url}. Redirecting to Login...`);

      // Clear all authentication data to force a re-login
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
      } catch (storageError) {
        console.error('Failed to clear storage on 401:', storageError);
      }

      // Note: The app's root layout (_layout.tsx) will detect the missing user/token
      // and handle the redirection to the Login screen automatically.
    }

    return Promise.reject(error);
  }
);

export default apiClient;