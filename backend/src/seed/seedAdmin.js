import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load .env from root backend folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

// Import User model
import userModel from "../model/user.model.js";

// ─── Admin Details ────────────────────────────────────────────────────────────
const ADMIN_NAME = "Pranjali Prasai";
const ADMIN_EMAIL = "pranjaliprasai1234@gmail.com";
const ADMIN_PASSWORD = "Admin@1234"; // Strong password as per requirements

// ─── Seed Function ────────────────────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    // Step 1: Connect to MongoDB
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      throw new Error("MONGO_URL is not defined in .env file");
    }

    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    // Step 2: Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("⚠️  Admin already exists");
      return;
    }

    // Step 3: Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Step 4: Create the admin user
    await userModel.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      isGoogle: false,
    });

    console.log("🎉 Admin user created successfully!");
    console.log(`   Name  : ${ADMIN_NAME}`);
    console.log(`   Email : ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
  } finally {
    // Step 5: Close connection
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

// Run the seed function
seedAdmin();
