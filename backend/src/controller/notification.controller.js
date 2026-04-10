import * as notificationService from "../service/notification.service.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[NotificationController] Fetching notifications for user: ${userId}`);
    const notifications = await notificationService.getNotificationsService(userId);
    const unreadCount = await notificationService.getUnreadCountService(userId);
    console.log(`[NotificationController] Found ${notifications.length} notifications, unread: ${unreadCount}`);
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error(`[NotificationController] Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const notification = await notificationService.markAsReadService(userId, id);
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await notificationService.markAllAsReadService(userId);
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, message, type, data } = req.body;
    const notification = await notificationService.createNotificationService(userId, title, message, type, data);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
