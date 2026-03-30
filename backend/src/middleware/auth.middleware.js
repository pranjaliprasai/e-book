import jwt from "jsonwebtoken";
import { AppError } from "../utils/error.js";

const isDev = process.env.NODE_ENV !== 'production';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (isDev) {
            console.log(`[Auth] ${req.method} ${req.originalUrl} | AuthHeader: ${authHeader ? 'Present' : 'Missing'}`);
        }

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Authorization token missing", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (isDev) {
            console.log(`[Auth Success] UserID: ${decoded.userId} | Role: ${decoded.role}`);
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (isDev) {
            console.error(`[Auth Error] ${req.method} ${req.originalUrl}:`, error.name === 'TokenExpiredError' ? 'Token Expired' : error.message);
            if (error.name === 'JsonWebTokenError') {
                console.error(`[Auth Error] Full Error:`, error);
            }
        }
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError("Invalid or expired token", 401));
        } else {
            next(error);
        }
    }
};
