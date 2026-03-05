import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export interface ExternalBook {
    id: string | number;
    title: string;
    authors: string[];
    cover: string;
    description?: string;
    source: 'Gutenberg' | 'OpenLibrary';
    downloadUrl?: string; // For Gutenberg
}

/**
 * Fetch books from Project Gutenberg via Backend
 */
export const fetchGutenbergBooks = async (query?: string): Promise<ExternalBook[]> => {
    try {
        const response = await apiClient.get(API_ENDPOINTS.EXTERNAL_GUTENBERG, {
            params: { query }
        });

        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        if (__DEV__) {
            console.error('Error fetching Gutenberg books via backend:', error);
        }
        return [];
    }
};

/**
 * Fetch books from Open Library via Backend
 */
export const fetchOpenLibraryBooks = async (query: string): Promise<ExternalBook[]> => {
    try {
        if (!query) return [];

        const response = await apiClient.get(API_ENDPOINTS.EXTERNAL_OPEN_LIBRARY, {
            params: { query }
        });

        if (response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        if (__DEV__) {
            console.error('Error fetching Open Library books via backend:', error);
        }
        return [];
    }
};
