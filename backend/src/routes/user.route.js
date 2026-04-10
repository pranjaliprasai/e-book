import express from "express";
import {
  createUserController,
  getAllUsersController,
  deleteUserController,
  updateMyProfileController,
  toggleFavoriteController,
  getFavoritesController,
  saveProgressController,
  getProgressController,
  deleteProgressController,
  getCurrentReadingController,
  updateReadingStatsController,
  getMyProfileController,
  updateUserController,
  getCompletedBooksController,
} from "../controller/user.controller.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// User specific routes
router.get("/favorites", verifyToken, getFavoritesController);
router.post("/favorites/:bookId", verifyToken, toggleFavoriteController);
router.get("/current-reading", verifyToken, getCurrentReadingController);
router.get("/completed", verifyToken, getCompletedBooksController);
router.get("/progress/:bookId", verifyToken, getProgressController);
router.post("/progress/:bookId", verifyToken, saveProgressController);
router.delete("/progress/:bookId", verifyToken, deleteProgressController);
router.post("/stats/update", verifyToken, updateReadingStatsController);
router.get("/profile", verifyToken, getMyProfileController);
router.put(
  "/profile",
  verifyToken,
  upload.single("profilePicture"),
  updateMyProfileController,
);

// Admin-only protection for these routes
router.get("/", verifyToken, isAdmin, getAllUsersController);
router.post("/", verifyToken, isAdmin, createUserController);
router.put("/:id", verifyToken, isAdmin, updateUserController);
router.delete("/:id", verifyToken, isAdmin, deleteUserController);

export default router;
