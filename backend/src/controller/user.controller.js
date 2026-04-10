import {
    createUserService,
    getAllUsersService,
    deleteUserService,
    updateUserService,
    toggleFavoriteService,
    getFavoritesService,
    saveProgressService,
    getProgressService,
    deleteProgressService,
    getCurrentReadingService,
    updateReadingStatsService,
    getCompletedBooksService,
} from "../service/user.service.js";
import successResponse from "../utils/success.response.js";
import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";

export const createUserController = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const newUser = await createUserService({ name, email, password, role });
        
        successResponse(
            {
                success: true,
                message: "User created successfully",
                data: newUser,
            },
            res
        );
    } catch (error) {
        console.error("Error in createUserController:", error);
        next(error);
    }
};

export const getAllUsersController = async (req, res, next) => {
    try {
        const { search } = req.query;
        const users = await getAllUsersService(search);
        successResponse(
            {
                success: true,
                message: "Users fetched successfully",
                data: users,
            },
            res
        );
    } catch (error) {
        console.error("Error in getAllUsersController:", error);
        next(error);
    }
};

export const deleteUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deleteUserService(id);
        successResponse(
            {
                success: true,
                message: "User deleted successfully",
                data: null,
            },
            res
        );
    } catch (error) {
        console.error("Error in deleteUserController:", error);
        next(error);
    }
};

export const updateUserController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedUser = await updateUserService(id, updateData);
        successResponse(
            {
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            },
            res
        );
    } catch (error) {
        console.error("Error in updateUserController:", error);
        next(error);
    }
};

export const getMyProfileController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        let user = await userModel.findById(userId).select("-password");
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.readingStats) {
            user.readingStats = {
                totalPagesRead: 0,
                totalReadingTime: 0,
                pagesReadToday: 0,
                lastReadDay: "",
                booksReadThisMonth: 0,
                readingTimeThisMonth: 0,
                highestReadingSessionMonth: 0,
                highestReadingSessionEver: 0,
                pagesReadThisMonth: 0,
                lastReadMonth: "",
                achievedMilestones: []
            };
            await user.save();
        }
        // Dynamic Achievement & Completion Sync
        let finalUser = user.toObject();
        try {
            const milestoneModel = (await import("../model/milestone.model.js")).default;
            const progressModel = (await import("../model/progress.model.js")).default;
            
            finalUser.readingStats.totalMilestonesSet = await milestoneModel.countDocuments({ user: userId });
            finalUser.readingStats.completedBooksCount = await progressModel.countDocuments({ user: userId, progress: { $gte: 99 } });
            finalUser.readingStats.booksInProgressCount = await progressModel.countDocuments({ user: userId, progress: { $gt: 0, $lt: 99 } });
        } catch (e) { console.warn("Sync failed:", e.message); }

        successResponse(
            {
                success: true,
                message: "Profile fetched successfully",
                data: finalUser,
            },
            res
        );
    } catch (error) {
        console.error("Error in getMyProfileController:", error);
        next(error);
    }
};

export const updateMyProfileController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.picture = `/uploads/profiles/${req.file.filename}`;
        }

        const updatedUser = await updateUserService(userId, updateData);
        successResponse(
            {
                success: true,
                message: "Profile updated successfully",
                data: updatedUser,
            },
            res
        );
    } catch (error) {
        console.error("Error in updateMyProfileController:", error);
        next(error);
    }
};

export const toggleFavoriteController = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.userId;
        const result = await toggleFavoriteService(userId, bookId);
        successResponse(
            {
                success: true,
                message: `Book ${result.action} favorites successfully`,
                data: result,
            },
            res
        );
    } catch (error) {
        console.error("Error in toggleFavoriteController:", error);
        next(error);
    }
};

export const getFavoritesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const favorites = await getFavoritesService(userId);
        successResponse(
            {
                success: true,
                message: "Favorites fetched successfully",
                data: favorites,
            },
            res
        );
    } catch (error) {
        console.error("Error in getFavoritesController:", error);
        next(error);
    }
};

export const saveProgressController = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const { progress } = req.body;
        const userId = req.user.userId;
        const result = await saveProgressService(userId, bookId, progress);
        successResponse(
            {
                success: true,
                message: "Progress saved successfully",
                data: result,
            },
            res
        );
    } catch (error) {
        console.error("Error in saveProgressController:", error);
        next(error);
    }
};

export const getProgressController = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.userId;
        const progress = await getProgressService(userId, bookId);
        successResponse(
            {
                success: true,
                message: "Progress fetched successfully",
                data: progress,
            },
            res
        );
    } catch (error) {
        console.error("Error in getProgressController:", error);
        next(error);
    }
};

export const getCurrentReadingController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const books = await getCurrentReadingService(userId);
        successResponse(
            {
                success: true,
                message: "Current reading books fetched successfully",
                data: books,
            },
            res
        );
    } catch (error) {
        console.error("Error in getCurrentReadingController:", error);
        next(error);
    }
};

export const updateReadingStatsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { pagesRead, timeSpent } = req.body;
        const result = await updateReadingStatsService(userId, { pagesRead, timeSpent });
        successResponse(
            {
                success: true,
                message: "Reading stats updated successfully",
                data: result,
            },
            res
        );
    } catch (error) {
        console.error("Error in updateReadingStatsController:", error);
        next(error);
    }
};

export const getCompletedBooksController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const books = await getCompletedBooksService(userId);
        successResponse(
            {
                success: true,
                message: "Completed books fetched successfully",
                data: books,
            },
            res
        );
    } catch (error) {
        console.error("Error in getCompletedBooksController:", error);
        next(error);
    }
};

export const deleteProgressController = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.userId;
        await deleteProgressService(userId, bookId);
        successResponse(
            {
                success: true,
                message: "Progress deleted successfully",
                data: null,
            },
            res
        );
    } catch (error) {
        console.error("Error in deleteProgressController:", error);
        next(error);
    }
};
