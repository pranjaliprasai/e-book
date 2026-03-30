import mongoose from "mongoose";

const NotificationModel = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["milestone", "system", "book"], default: "milestone" },
    isRead: { type: Boolean, default: false },
    data: { type: Object, default: {} }, // Extra metadata if needed
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationModel);
