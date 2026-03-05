import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Clean Auth Services for SmartShelf
 * Returns unified response { success, token, user, message }
 */

export const login = async (email: string, password: string) => {
    try {
        const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });

        // Backend: SuccessResponse { data: { token, user } }
        if (response.data.success) {
            const { token, user } = response.data.data;
            return { success: true, token, user };
        }

        return { success: false, message: response.data.message };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Login failed'
        };
    }
};

export const googleLogin = async (code: string, redirectUri: string) => {
    try {
        const response = await apiClient.get(API_ENDPOINTS.GOOGLE_CALLBACK, {
            params: { code, redirect_uri: redirectUri }
        });

        // Backend: { data: { name, email, ..., token } }
        if (response.data.success) {
            const { token, ...user } = response.data.data;
            return { success: true, token, user };
        }

        return { success: false, message: response.data.message };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Google login failed'
        };
    }
};

export const register = async (name: string, email: string, password: string) => {
    try {
        const response = await apiClient.post(API_ENDPOINTS.REGISTER, { name, email, password });
        return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Registration failed'
        };
    }
};

export const forgotPassword = async (email: string) => {
    try {
        const response = await apiClient.post(API_ENDPOINTS.FORGET_PASSWORD, { email });
        return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to send OTP' };
    }
};

export const resetPassword = async (otp: string, newPassword: string) => {
    try {
        const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, { otp, newPassword });
        return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to reset password' };
    }
};
