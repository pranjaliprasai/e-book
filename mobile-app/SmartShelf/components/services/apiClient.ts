import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants/api';

/**
 * INTERNAL SINGLETON STATE
 * We use module-level variables for synchronous, reliable access to tokens.
 */
let cachedToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const registerUnauthorizedHandler = (handler: () => void) => {
  if (__DEV__) console.log('🛡️ [API Client] Unauthorized Handler Registered.');
  onUnauthorized = handler;
};

/**
 * Utility to sync auth headers with local singleton for performance and reliability
 */
export const syncAuthHeader = (token: string | null) => {
    cachedToken = token;
    if (__DEV__) console.log(`🛡️ [Sync] Token cached: ${!!token}`);
    
    // Also update common headers for third-party libraries that might use the defaults
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        apiClient.defaults.headers.common['authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
        delete apiClient.defaults.headers.common['authorization'];
    }
};

let last401Time = 0;
const DEBOUNCE_401 = 2000; // Only handle 401 once every 2 seconds

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
      const VERSION = "7.0.1";
      // 1. Resolve token from the local synchronous singleton (fastest/most reliable)
      let finalToken = cachedToken;
      let source = "SINGLETON_CACHE";

      // 2. Fallback to AsyncStorage only if singleton is empty (e.g. after refresh or bundle reload)
      if (!finalToken) {
          finalToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (finalToken) {
            cachedToken = finalToken; // Update cache for the next request
            source = "ASYNC_STORAGE_FALLBACK";
          }
      }

      // 3. Exhaustive Injection Strategy
      if (finalToken && finalToken.trim() !== "") {
        const bearerToken = `Bearer ${finalToken}`;
        
        if (config.headers) {
          config.headers['Authorization'] = bearerToken;
        }

        if (__DEV__) {
          const maskedToken = finalToken.length > 8 ? `${finalToken.substring(0, 5)}...` : "[short]";
          console.log(`🚀 [API Request v${VERSION}] ${config.method?.toUpperCase()} ${config.url} | TOKEN_SRC: ${source} | VAL: ${maskedToken}`);
          
          // ABSOLUTE PRE-FLIGHT LOG: Explicitly check the object keys
          if (config.headers.toJSON) {
              const snap = config.headers.toJSON();
              const hasAuth = !!(snap.Authorization || snap.authorization);
              console.log(`📋 [Pre-flight Snapshot] Auth Header Present: ${hasAuth}`);
              if (!hasAuth) console.error("🛑 [CRITICAL ERROR] Header was not found in snap despite .set()!");
          }
        }
      } else {
        if (__DEV__) {
          console.log(`📤 [API Request v${VERSION}] ${config.method?.toUpperCase()} ${config.url} (NO TOKEN FOUND)`);
        }
      }

      return config;
    } catch (error) {
      console.error('❌ [API Client] Request Interceptor Error:', error);
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

    // ─── 401 Handler ───────────────────────────────────────────────────────
    // DO NOT call AsyncStorage.multiRemove() here. Doing so nukes the auth
    // token mid-session, causing every subsequent request in the same batch
    // (e.g. loadInitialData) to also fail with "Authorization token missing".
    //
    // The AuthProvider (use-auth.tsx) is the single source of truth for
    // session state. It restores the session on mount and its logout() function
    // handles cleanup. We just log the 401 here and let the caller decide.
    // ────────────────────────────────────────────────────────────────────────
    // ─── 401 Handler with Automatic Retry ──────────────────────────────────
    if (response?.status === 401) {
      // @ts-ignore - custom flag for retry
      if (!config?._retry) {
        // @ts-ignore
        config._retry = true;
        
        if (__DEV__) console.log(`🌀 [API Client] 401 at ${config?.url} — Retrying once in 500ms...`);
        
        // Wait 500ms and retry the request once
        await new Promise(resolve => setTimeout(resolve, 500));
        if (config) {
          return apiClient(config as any);
        }
      }

      const now = Date.now();
      if (now - last401Time > DEBOUNCE_401) {
        last401Time = now;
        if (__DEV__) console.log(`🛑 [API Client] Persistent 401 at ${config?.url} — notifying auth provider.`);
        
        if (onUnauthorized) onUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;