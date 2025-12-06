import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(process.cwd(), ".env") });

import { connectDB } from "./src/config/db.js";

const app = express();

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
