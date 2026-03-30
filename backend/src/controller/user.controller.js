import {
    getAllUsersService,
    deleteUserService,
    updateUserService,
    toggleFavoriteService,
    getFavoritesService,
    saveProgressService,
    getProgressService,
    getCurrentReadingService,
    updateReadingStatsService,
} from "../service/user.service.js";
import successResponse from "../utils/success.response.js";
import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";

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
        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            throw new AppError("User not found", 404);
        }
        successResponse(
            {
                success: true,
                message: "Profile fetched successfully",
                data: user,
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

        // Handle profile picture if uploaded
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
