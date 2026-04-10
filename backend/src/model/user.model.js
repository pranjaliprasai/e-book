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
    isSubscribed: { type: Boolean, default: false },
    subscriptionExpiry: { type: Date, default: null },
    readBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    readingStats: {
      totalPagesRead: { type: Number, default: 0 },
      totalReadingTime: { type: Number, default: 0 }, // in seconds
      pagesReadToday: { type: Number, default: 0 },
      lastReadDay: { type: String, default: "" }, // Format: YYYY-MM-DD
      
      // Monthly Stats
      booksReadThisMonth: { type: Number, default: 0 },
      readingTimeThisMonth: { type: Number, default: 0 }, // in seconds
      highestReadingSessionMonth: { type: Number, default: 0 }, // in seconds
      highestReadingSessionEver: { type: Number, default: 0 }, // in seconds
      pagesReadThisMonth: { type: Number, default: 0 },
      highestPagesReadEver: { type: Number, default: 0 }, // max pages in a single day
      lastReadMonth: { type: String, default: "" }, // Format: YYYY-MM
      
      achievedMilestones: [{ type: String }], // e.g., ["PAGE_10", "TIME_1"]
    },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);
export default mongoose.model("User", UserModel);
