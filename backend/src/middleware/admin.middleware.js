import jwt from "jsonwebtoken";
import { AppError } from "../utils/error.js";

export const isAdmin = (req, res, next) => {
    console.log(`[AdminCheck] URL: ${req.originalUrl} | Method: ${req.method}`);
    console.log(`[AdminCheck] req.user:`, JSON.stringify(req.user, null, 2));

    if (req.user && req.user.role === "admin") {
        console.log(`[AdminCheck] Access Granted`);
        next();
    } else {
        console.warn(`[AdminCheck] Access Denied: Role is ${req.user?.role || 'Missing'}`);
        next(new AppError("Access denied. Admin role required.", 403));
    }
};
