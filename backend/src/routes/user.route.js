import express from "express";
import {
  getAllUsersController,
  deleteUserController,
  updateMyProfileController,
  toggleFavoriteController,
  getFavoritesController,
  saveProgressController,
  getProgressController,
  getCurrentReadingController,
  updateReadingStatsController,
  getMyProfileController,
} from "../controller/user.controller.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

import { upload } from "../middleware/upload.middleware.js";

// User specific routes
router.get("/favorites", verifyToken, getFavoritesController);
router.post("/favorites/:bookId", verifyToken, toggleFavoriteController);
router.get("/current-reading", verifyToken, getCurrentReadingController);
router.get("/progress/:bookId", verifyToken, getProgressController);
router.post("/progress/:bookId", verifyToken, saveProgressController);
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
router.delete("/:id", verifyToken, isAdmin, deleteUserController);

export default router;
