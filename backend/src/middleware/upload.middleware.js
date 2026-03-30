import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directories exist
const uploadDir = "uploads/books";
const profileDir = "uploads/profiles";

[uploadDir, profileDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "profilePicture") {
            cb(null, profileDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "pdf") {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed for the book content"), false);
        }
    } else if (file.fieldname === "coverImage" || file.fieldname === "profilePicture") {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error(`Only images are allowed for the ${file.fieldname === "coverImage" ? "cover" : "profile picture"}`), false);
        }
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
