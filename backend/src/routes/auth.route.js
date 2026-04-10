import express from "express";
import {
  forgetPasswordController,
  googleAuthController,
  googleCallbackController,
  googleCodeController,
  googleIdTokenController,
  loginUserController,
  registerUserController,
  resetPasswordController,
} from "../controller/auth.controller.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/forget-password", forgetPasswordController);
router.post("/reset-password", resetPasswordController);

router.get("/google-auth", googleAuthController);
router.get("/google/callback", googleCallbackController);
router.post("/google/token", googleIdTokenController);
router.post("/google/code", googleCodeController);   // PKCE exchange (mobile)

export default router;
