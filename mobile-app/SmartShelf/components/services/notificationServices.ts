import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/api";

export const getNotifications = async () => {
    const VERSION = "7.0.1";
    try {
        if (__DEV__) {
            const hasHeader = !!(
                (apiClient.defaults.headers.common as any)['Authorization'] || 
                (apiClient.defaults.headers.common as any)['authorization']
            );
            console.log(`📡 [Service v${VERSION}] Fetching notifications. Common Auth Header: ${hasHeader ? 'READY' : 'MISSING'}`);
        }
        
        const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
        if (__DEV__) console.log("Notifications fetch successful, count:", response.data.data?.length);
        return response.data;
    } catch (error: any) {
        console.error(`❌ [Service v${VERSION}] Error fetching notifications:`, error.message || error);
        if (error.response) {
            console.log("Error status:", error.response.status);
            console.log("Error data:", error.response.data);
        }
        return { success: false, message: error.response?.data?.message || 'Error fetching notifications' };
    }
};

export const createNotification = async (title: string, message: string, type: string = "milestone") => {
    try {
        const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS, { title, message, type });
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error creating notification:", error);
        return { success: false, message: error.response?.data?.message || 'Error creating notification' };
    }
};

export const markAsRead = async (id: string) => {
    try {
        const response = await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error marking notification as read:", error);
        return { success: false, message: error.response?.data?.message || 'Error marking read' };
    }
};

export const markAllAsRead = async () => {
    try {
        const response = await apiClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`);
        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, message: error.response?.data?.message || 'Error marking all read' };
    }
};
