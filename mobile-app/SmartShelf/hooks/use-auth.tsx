import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../components/constants/api';

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
                const [storedUser, storedToken] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
                    AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
                ]);

                if (storedUser && storedToken) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    if (__DEV__) console.log('📦 [Auth Hook] Session restored for:', parsedUser.email);
                } else {
                    if (__DEV__) console.log('📦 [Auth Hook] No valid session found in storage.');
                }
            } catch (error) {
                console.error('📦 [Auth Hook] Failed to load initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };

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

            setUser(userData);
            if (__DEV__) console.log('✅ [Auth login] Success! Token saved persistently.');
        } catch (error) {
            console.error('❌ [Auth login] Failed to persist auth data:', error);
        }
    };

    /**
     * Handle Logout: Clears all auth data
     */
    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.REFRESH_TOKEN
            ]);
            setUser(null);
            if (__DEV__) console.log('👋 [Auth logout] Storage cleared, User logged out.');
        } catch (error) {
            console.error('❌ [Auth logout] Failed to clear storage:', error);
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
