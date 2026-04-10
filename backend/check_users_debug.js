
import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

import userModel from "./src/model/user.model.js";

const checkUsers = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    const users = await userModel.find({}, "name email role");
    console.log("Users in Database:");
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error("❌ Error checking users:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

checkUsers();
