
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

import userModel from "./src/model/user.model.js";

const verifyLogin = async (email, password) => {
  try {
    const mongoURL = process.env.MONGO_URL;
    await mongoose.connect(mongoURL);
    console.log("✅ Connected to MongoDB");

    const user = await userModel.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log(`✅ Login successful for ${email}!`);
      console.log(`   Name: ${user.name}, Role: ${user.role}`);
    } else {
      console.log(`❌ Invalid password for ${email}`);
    }

  } catch (error) {
    console.error("❌ Error verifying login:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

const emailArg = process.argv[2] || "pranjalprasai1234@gmail.com";
const passwordArg = process.argv[3] || "Admin@1234";

verifyLogin(emailArg, passwordArg);
