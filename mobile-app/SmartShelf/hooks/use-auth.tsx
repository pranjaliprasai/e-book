import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../components/constants/api';
import { registerUnauthorizedHandler, syncAuthHeader } from '../components/services/apiClient';

/**
 * Enhanced Authentication Provider for SmartShelf
 * Manages user state and persistent storage Synchronization
 */

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: Restore session from AsyncStorage
    useEffect(() => {
        const loadInitialSession = async () => {
            try {
                // Sequential retrieval is safer for debugging and avoids bulk failure
                const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
                const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

                if (storedUser && storedToken) {
                    const parsedUser = JSON.parse(storedUser);
                    
                    // 1. Sync header FIRST
                    syncAuthHeader(storedToken);
                    
                    // 2. Set user state SECOND
                    setUser(parsedUser);
                    
                    if (__DEV__) console.log('📦 [Auth Hook] Session restored for:', parsedUser.email);
                } else if (storedUser && !storedToken) {
                    if (__DEV__) console.warn('📦 [Auth Hook] Inconsistent state. Cleaning storage.');
                    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.ACCESS_TOKEN]);
                    setUser(null);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('📦 [Auth Hook] Failed to load initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // 1. Immediately register the 401 listener so it's ready for early requests
        registerUnauthorizedHandler(() => {
            if (__DEV__) console.log('🛡️ [Auth Hook] Global 401 detected. Initiating clean logout.');
            logout(); // Full reset: kills state, storage, and singleton headers
        });

        // 2. Load the session
        loadInitialSession();
    }, []);

    /**
     * Handle Login: Saves auth data to storage and updates state
     */
    const login = async (userData: any, token: string) => {
        try {
            if (!token || !userData) {
                console.error('🛑 [Auth login] Missing token or user data!');
                return;
            }

            // Save both token and user object
            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
                AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
            ]);

            // 1. Sync the axios header IMMEDIATELY so any triggered re-renders already have it
            syncAuthHeader(token);

            // 2. Set user state to trigger UI changes
            setUser(userData);
            
            if (__DEV__) console.log('✅ [Auth login] Success! Token saved and synced.');
        } catch (error) {
            console.error('❌ [Auth login] Failed to persist auth data:', error);
        }
    };

    /**
     * Handle Logout: Clears all auth data
     */
    const logout = async () => {
        try {
            // Set user state to null first to ensure UI updates immediately
            // regardless of storage removal success
            setUser(null);
            // Clear the axios header for subsequent requests
            syncAuthHeader(null);
            
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.REFRESH_TOKEN
            ]);
            
            if (__DEV__) console.log('👋 [Auth logout] Storage cleared, User logged out.');
        } catch (error) {
            console.error('❌ [Auth logout] Failed to clear storage:', error);
            // Even if storage fails (e.g. disk full), we already set user to null
            // so the app will redirect to login.
        }
    };

    /**
     * Update User: Partially update user data in storage and state
     */
    const updateUser = async (updatedData: any) => {
        try {
            const newUser = { ...user, ...updatedData };
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUser));
            setUser(newUser);
            if (__DEV__) console.log('🔄 [Auth updateUser] User data synchronized.');
        } catch (error) {
            console.error('❌ [Auth updateUser] Failed to update user data:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            updateUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
