import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetMinutes: {
            type: Number,
            required: true,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
    },
    { timestamps: true }
);

// We might want to ensure a user only has one 'active' milestone at a time
milestoneSchema.index(
    { user: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "active" },
    }
);

const milestoneModel = mongoose.model("Milestone", milestoneSchema);
export default milestoneModel;
