import express from "express";
import {
    addBookController,
    getAllBooksController,
    updateBookController,
    deleteBookController,
    importExternalBookController,
    seedBooksController,
    getBookByIdController,
} from "../controller/book.controller.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

import { verifyToken } from "../middleware/auth.middleware.js";

import {
    getGutenbergBooksController,
    getOpenLibraryBooksController
} from "../controller/externalBook.controller.js";

const router = express.Router();

// Allow all logged-in users (admin or user) to view books
router.get("/", verifyToken, getAllBooksController);

// External book APIs — must be defined BEFORE /:id to avoid Express
// matching "external" as the :id parameter.
router.get("/external/gutenberg", verifyToken, getGutenbergBooksController);
router.get("/external/openlibrary", verifyToken, getOpenLibraryBooksController);

router.get("/:id", verifyToken, getBookByIdController);

// Bulk seed discovery books (Admin only)
router.post("/seed", verifyToken, isAdmin, seedBooksController);

// Restricted to Admin for management
router.post(
    "/",
    verifyToken,
    isAdmin,
    upload.fields([
        { name: "pdf", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    addBookController
);

router.put(
    "/:id",
    verifyToken,
    isAdmin,
    upload.fields([
        { name: "pdf", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    updateBookController
);

router.delete("/:id", verifyToken, deleteBookController);

export default router;
