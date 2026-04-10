import express from "express";
import * as notificationController from "../controller/notification.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, notificationController.getNotifications);
router.post("/", verifyToken, notificationController.createNotification);
router.patch("/read-all", verifyToken, notificationController.markAllAsRead);
router.patch("/:id/read", verifyToken, notificationController.markAsRead);

export default router;
