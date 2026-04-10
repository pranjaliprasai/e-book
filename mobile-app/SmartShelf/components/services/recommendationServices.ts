import apiClient from './apiClient';

export interface RecommendedBook {
    _id: string;
    title: string;
    author: string;
    genre: string;
    coverImageUrl: string;
    rating: number;
    isbn: string;
}

export const getBookRecommendations = async (bookId: string): Promise<RecommendedBook[]> => {
    try {
        const response = await apiClient.get(`/recommendation/${bookId}`);
        return response.data.data;
    } catch (error) {
        console.error('[Recommendation Service Error]', error);
        return [];
    }
};
