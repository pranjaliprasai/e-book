import apiClient from './apiClient';

export const getComments = async (bookId: string) => {
    try {
        const response = await apiClient.get(`/comment/${bookId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addComment = async (bookId: string, content: string) => {
    try {
        const response = await apiClient.post('/comment', { bookId, content });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteComment = async (commentId: string) => {
    try {
        const response = await apiClient.delete(`/comment/${commentId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
