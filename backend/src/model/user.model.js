import mongoose from "mongoose";

const UserModel = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    isGoogle: { type: Boolean, default: false },
    picture: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    readingStats: {
      totalPagesRead: { type: Number, default: 0 },
      totalReadingTime: { type: Number, default: 0 }, // in seconds
      achievedMilestones: [{ type: String }], // e.g., ["PAGE_10", "TIME_1"]
    },
  },
  { timestamps: true }
);
export default mongoose.model("User", UserModel);
