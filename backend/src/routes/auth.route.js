import express from "express";
import { registerUserController } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/register", registerUserController);
