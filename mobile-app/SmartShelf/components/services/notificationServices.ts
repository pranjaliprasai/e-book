import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

export const getNotifications = async () => {
    try {
        if (__DEV__) console.log("Fetching notifications from:", `${apiClient.defaults.baseURL}${API_ENDPOINTS.NOTIFICATIONS}`);
        const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
        if (__DEV__) console.log("Notifications fetch successful, count:", response.data.data?.length);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching notifications:", error.message || error);
        if (error.response) {
            console.log("Error status:", error.response.status);
            console.log("Error data:", error.response.data);
        }
        throw error;
    }
};

export const markAsRead = async (id: string) => {
    try {
        const response = await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`);
        return response.data;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};

export const markAllAsRead = async () => {
    try {
        const response = await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
        return response.data;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
};
