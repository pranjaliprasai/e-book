import jwt from "jsonwebtoken";
import { AppError } from "../utils/error.js";

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        next(new AppError("Access denied. Admin role required.", 403));
    }
};
