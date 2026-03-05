import {
    getAllUsersService,
    deleteUserService,
    toggleFavoriteService,
    getFavoritesService,
} from "../service/user.service.js";
import successResponse from "../utils/success.response.js";

export const getAllUsersController = async (req, res, next) => {
    try {
        const users = await getAllUsersService();
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
