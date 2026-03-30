import notificationModel from "../model/notification.model.js";

export const getNotificationsService = async (userId) => {
  try {
    return await notificationModel.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  } catch (error) {
    console.error("Error in getNotificationsService:", error);
    throw error;
  }
};

export const createNotificationService = async (userId, title, message, type = "milestone", data = {}) => {
  try {
    const notification = new notificationModel({
      user: userId,
      title,
      message,
      type,
      data,
    });
    return await notification.save();
  } catch (error) {
    console.error("Error in createNotificationService:", error);
    throw error;
  }
};

export const markAsReadService = async (userId, notificationId) => {
  try {
    return await notificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  } catch (error) {
    console.error("Error in markAsReadService:", error);
    throw error;
  }
};

export const markAllAsReadService = async (userId) => {
  try {
    return await notificationModel.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
  } catch (error) {
    console.error("Error in markAllAsReadService:", error);
    throw error;
  }
};

export const getUnreadCountService = async (userId) => {
  try {
    return await notificationModel.countDocuments({ user: userId, isRead: false });
  } catch (error) {
    console.error("Error in getUnreadCountService:", error);
    throw error;
  }
};
