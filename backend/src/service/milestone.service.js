import milestoneModel from "../model/milestone.model.js";
import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";
import { createNotificationService } from "./notification.service.js";

export const createMilestoneService = async (userId, targetMinutes) => {
    try {
        // Cancel any existing active milestones for the user
        await milestoneModel.updateMany(
            { user: userId, status: "active" },
            { $set: { status: "cancelled" } }
        );

        const newMilestone = new milestoneModel({
            user: userId,
            targetMinutes,
        });
        await newMilestone.save();
        return newMilestone;
    } catch (error) {
        console.error("Error in createMilestoneService:", error);
        throw error;
    }
};

export const getActiveMilestoneService = async (userId) => {
    try {
        const milestone = await milestoneModel.findOne({ user: userId, status: "active" });
        return milestone;
    } catch (error) {
        console.error("Error in getActiveMilestoneService:", error);
        throw error;
    }
};

export const completeMilestoneService = async (userId, milestoneId) => {
    try {
        const milestone = await milestoneModel.findOneAndUpdate(
            { _id: milestoneId, user: userId },
            { $set: { status: "completed" } },
            { new: true }
        );
        if (!milestone) throw new AppError("Milestone not found", 404);

        // Notify the user
        await createNotificationService(
            userId,
            "🎉 Milestone Reached!",
            `Congratulations! You've achieved your goal of ${milestone.targetMinutes} minutes of reading.`,
            "milestone"
        );

        // Record achievement on user profile
        const user = await userModel.findById(userId);
        if (user) {
            const milestoneKey = `TIME_${milestone.targetMinutes}`;
            if (!user.readingStats) {
                user.readingStats = {
                    totalPagesRead: 0,
                    totalReadingTime: 0,
                    pagesReadToday: 0,
                    lastReadDay: "",
                    booksReadThisMonth: 0,
                    readingTimeThisMonth: 0,
                    pagesReadThisMonth: 0,
                    lastReadMonth: "",
                    achievedMilestones: []
                };
            }
            if (!user.readingStats.achievedMilestones.includes(milestoneKey)) {
                user.readingStats.achievedMilestones.push(milestoneKey);
                await user.save();
            }
        }

        return milestone;
    } catch (error) {
        console.error("Error in completeMilestoneService:", error);
        throw error;
    }
};

export const cancelMilestoneService = async (userId, milestoneId) => {
    try {
        let query = { user: userId, status: "active" };
        if (milestoneId) {
            query._id = milestoneId;
        }
        const milestone = await milestoneModel.findOneAndUpdate(
            query,
            { $set: { status: "cancelled" } },
            { new: true }
        );
        // If not found, they might not have an active session, which is fine
        return milestone || null;
    } catch (error) {
        console.error("Error in cancelMilestoneService:", error);
        throw error;
    }
};
