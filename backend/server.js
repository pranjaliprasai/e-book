import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { connectDB } from "./src/config/db.js";
import { errorConverter, notFound } from "./src/utils/error.js";

import indexRoute from "./src/routes/index.route.js";
import cors from "cors";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Serve static files from uploads folder
app.use("/uploads", express.static(resolve(__dirname, "uploads")));

app.use("/api", indexRoute);

app.use(notFound);
app.use(errorConverter);

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "E-Book API is running" });
});

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
