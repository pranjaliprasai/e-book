import express from "express";
import {
    getAllUsersController,
    deleteUserController,
    toggleFavoriteController,
    getFavoritesController,
} from "../controller/user.controller.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// User specific routes
router.get("/favorites", verifyToken, getFavoritesController);
router.post("/favorites/:bookId", verifyToken, toggleFavoriteController);

// Admin-only protection for these routes
router.get("/", verifyToken, isAdmin, getAllUsersController);
router.delete("/:id", verifyToken, isAdmin, deleteUserController);

export default router;
