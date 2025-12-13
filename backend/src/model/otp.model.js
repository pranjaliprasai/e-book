import mongoose from "mongoose";

const Otp = new mongoose.Schema(
  {
    code: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expireAt: { type: Date, required: true },
  },
  { timestamps: true }
);
export default mongoose.model("Otp", Otp);
