import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controller/khalti.controller.js";

const router = express.Router();

router.post("/initiate", verifyToken, initiateKhaltiPayment);
router.get("/verify", verifyKhaltiPayment); // Public route for Khalti redirect

export default router;
