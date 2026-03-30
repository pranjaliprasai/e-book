import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },
        progress: {
            type: Number,
            default: 0, // This will store scroll position (y-offset) or percentage
        },
        lastRead: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Ensure a user has only one progress record per book
progressSchema.index({ user: 1, book: 1 }, { unique: true });

const progressModel = mongoose.model("ReadingProgress", progressSchema);
export default progressModel;
