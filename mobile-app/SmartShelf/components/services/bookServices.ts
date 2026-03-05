import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Standard Book Services for SmartShelf
 */

export const getBooks = async (genre?: string, isDiscovery?: boolean, limit?: number, search?: string, source?: string) => {
    try {
        const response = await apiClient.get(API_ENDPOINTS.GET_BOOKS, {
            params: { genre, isDiscovery, ...(limit ? { limit } : {}), ...(search ? { search } : {}), ...(source ? { source } : {}) }
        });

        if (response.data.success) {
            return { success: true, data: response.data.data };
        }

        return { success: false, message: response.data.message };
    } catch (error: any) {
        // Detailed log for 401 debugging
        if (__DEV__ && error.response?.status === 401) {
            console.log('🛑 [getBooks] Unauthorized: The token was rejected by the server.');
        }

        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch books'
        };
    }
};

export const importBook = async (bookData: any) => {
    try {
        console.log('--- Import Book Request ---');
        console.log('Endpoint:', API_ENDPOINTS.IMPORT_BOOK);
        console.log('Payload:', bookData);
        const response = await apiClient.post(API_ENDPOINTS.IMPORT_BOOK, bookData);
        console.log('Import Response Status:', response.status);
        return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
        console.error('Import Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to save book'
        };
    }
};

export const deleteBook = async (id: string) => {
    try {
        console.log('--- Delete Book Request ---');
        console.log('ID:', id);
        console.log('Endpoint:', `${API_ENDPOINTS.GET_BOOKS}/${id}`);
        const response = await apiClient.delete(`${API_ENDPOINTS.GET_BOOKS}/${id}`);
        console.log('Delete Response Status:', response.status);
        return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
        console.error('Delete Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to remove book'
        };
    }
};

export const toggleFavorite = async (bookId: string) => {
    try {
        const response = await apiClient.post(`${API_ENDPOINTS.TOGGLE_FAVORITE}/${bookId}`);
        return {
            success: response.data.success,
            message: response.data.message,
            action: response.data.data.action,
            favorites: response.data.data.favorites
        };
    } catch (error: any) {
        console.error('Toggle Favorite Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to update favorites'
        };
    }
};

export const getFavorites = async () => {
    try {
        const response = await apiClient.get(API_ENDPOINTS.GET_FAVORITES);
        if (response.data.success) {
            return { success: true, data: response.data.data };
        }
        return { success: false, message: response.data.message };
    } catch (error: any) {
        console.error('Get Favorites Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch favorites'
        };
    }
};

export const getBookById = async (id: string) => {
    try {
        const response = await apiClient.get(`${API_ENDPOINTS.GET_BOOKS}/${id}`);
        if (response.data.success) {
            return { success: true, data: response.data.data };
        }
        return { success: false, message: response.data.message };
    } catch (error: any) {
        console.error('Get Book By ID Error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch book details'
        };
    }
};
