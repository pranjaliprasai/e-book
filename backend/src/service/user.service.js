import userModel from "../model/user.model.js";
import { AppError } from "../utils/error.js";

export const getAllUsersService = async () => {
    try {
        // Return all users excluding their password
        const users = await userModel.find({}).select("-password").sort({ createdAt: -1 });
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
