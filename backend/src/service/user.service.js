import userModel from "../model/user.model.js";
import progressModel from "../model/progress.model.js";
import bookModel from "../model/book.model.js";
import { AppError } from "../utils/error.js";
import { hashPassword } from "../helper/auth.helper.js";

export const getAllUsersService = async (search) => {
    try {
        const query = {};
        if (search) {
            const trimmedSearch = search.trim();
            query.$or = [
                { name: { $regex: trimmedSearch, $options: 'i' } },
                { email: { $regex: trimmedSearch, $options: 'i' } }
            ];
        }

        // Return users excluding their password
        const users = await userModel.find(query).select("-password").sort({ createdAt: -1 });
        return users;
    } catch (error) {
        console.error("Error in getAllUsersService:", error);
        throw error;
    }
};

export const deleteUserService = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Optional: Prevent deleting the last admin or yourself
        if (user.role === "admin") {
            // You might want to add a check here to prevent accidental self-deletion
            // throw new AppError("Cannot delete admin users via this portal", 403);
        }

        await userModel.findByIdAndDelete(userId);
        return true;
    } catch (error) {
        console.error("Error in deleteUserService:", error);
        throw error;
    }
};

export const updateUserService = async (userId, updateData) => {
    try {
        const user = await userModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        const dataToUpdate = { ...updateData };
        if (dataToUpdate.password) {
            dataToUpdate.password = await hashPassword(dataToUpdate.password);
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: dataToUpdate },
            { new: true, runValidators: true }
        ).select("-password");

        return updatedUser;
    } catch (error) {
        console.error("Error in updateUserService:", error);
        throw error;
    }
};

export const toggleFavoriteService = async (userId, bookId) => {
    try {
        const user = await userModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        const index = user.favorites.findIndex(id => id.toString() === bookId.toString());
        if (index === -1) {
            user.favorites.push(bookId);
            await user.save();
            return { action: "added", favorites: user.favorites };
        } else {
            user.favorites.splice(index, 1);
            await user.save();
            return { action: "removed", favorites: user.favorites };
        }
    } catch (error) {
        console.error("Error in toggleFavoriteService:", error);
        throw error;
    }
};

export const getFavoritesService = async (userId) => {
    try {
        const user = await userModel.findById(userId).populate("favorites");
        if (!user) throw new AppError("User not found", 404);
        return user.favorites;
    } catch (error) {
        console.error("Error in getFavoritesService:", error);
        throw error;
    }
};

export const saveProgressService = async (userId, bookId, progress) => {
    try {
        console.log(`[Service] Saving progress: user=${userId}, book=${bookId}, val=${progress}`);
        const result = await progressModel.findOneAndUpdate(
            { user: userId, book: bookId },
            { progress, lastRead: new Date() },
            { upsert: true, new: true }
        );
        console.log(`[Service] Progress saved:`, result ? "Success" : "Failed");
        return result;
    } catch (error) {
        console.error("Error in saveProgressService:", error);
        throw error;
    }
};

export const getProgressService = async (userId, bookId) => {
    try {
        const progress = await progressModel.findOne({ user: userId, book: bookId });
        return progress;
    } catch (error) {
        console.error("Error in getProgressService:", error);
        throw error;
    }
};

export const getCurrentReadingService = async (userId) => {
    try {
        console.log(`[Service] Fetching current reading for user: ${userId}`);
        const progresses = await progressModel.find({ user: userId })
            .sort({ lastRead: -1 })
            .populate("book");

        console.log(`[Service] Found ${progresses.length} progress records`);

        // Filter out any entries where book might have been deleted
        const results = progresses.filter(p => p.book).map(p => ({
            ...p.book.toObject(),
            progress: p.progress,
            lastRead: p.lastRead
        }));

        console.log(`[Service] Returning ${results.length} valid current reading books`);
        return results;
    } catch (error) {
        console.error("Error in getCurrentReadingService:", error);
        throw error;
    }
};

export const updateReadingStatsService = async (userId, { pagesRead = 0, timeSpent = 0 }) => {
    try {
        const user = await userModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        if (!user.readingStats) {
            user.readingStats = {
                totalPagesRead: 0,
                totalReadingTime: 0,
                achievedMilestones: []
            };
        }

        user.readingStats.totalPagesRead += Number(pagesRead);
        user.readingStats.totalReadingTime += Number(timeSpent);

        const newMilestones = [];
        const PAGE_MILESTONES = [10, 20, 100, 300];
        const TIME_MILESTONES = [1, 10, 20, 100, 300]; // in minutes

        // Check page milestones
        PAGE_MILESTONES.forEach(m => {
            const milestoneKey = `PAGE_${m}`;
            if (user.readingStats.totalPagesRead >= m && !user.readingStats.achievedMilestones.includes(milestoneKey)) {
                user.readingStats.achievedMilestones.push(milestoneKey);
                newMilestones.push(milestoneKey);
            }
        });

        // Check time milestones
        const timeInMinutes = user.readingStats.totalReadingTime / 60;
        TIME_MILESTONES.forEach(m => {
            const milestoneKey = `TIME_${m}`;
            if (timeInMinutes >= m && !user.readingStats.achievedMilestones.includes(milestoneKey)) {
                user.readingStats.achievedMilestones.push(milestoneKey);
                newMilestones.push(milestoneKey);
            }
        });

        await user.save();
        return {
            stats: user.readingStats,
            newMilestones
        };
    } catch (error) {
        console.error("Error in updateReadingStatsService:", error);
        throw error;
    }
};
