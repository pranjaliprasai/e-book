import express from "express";
import {
    createMilestoneController,
    getActiveMilestoneController,
    completeMilestoneController,
    cancelMilestoneController
} from "../controller/milestone.controller.js";
import { verifyToken as authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get active milestone
router.get("/active", authMiddleware, getActiveMilestoneController);

// Start a new milestone
router.post("/", authMiddleware, createMilestoneController);

// Complete a milestone
router.put("/complete/:id", authMiddleware, completeMilestoneController);

// Cancel an active milestone
// Cancel an active milestone. The ID is normally known, but we'll accept /cancel and /cancel/:id
router.delete("/cancel/:id", authMiddleware, cancelMilestoneController);
router.delete("/cancel", authMiddleware, cancelMilestoneController);

export default router;
