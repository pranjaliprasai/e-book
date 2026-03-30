import {
    createMilestoneService,
    getActiveMilestoneService,
    completeMilestoneService,
    cancelMilestoneService
} from "../service/milestone.service.js";
import successResponse from "../utils/success.response.js";

export const createMilestoneController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { targetMinutes } = req.body;
        const newMilestone = await createMilestoneService(userId, targetMinutes);
        successResponse(
            {
                success: true,
                message: "Milestone started successfully",
                data: newMilestone,
            },
            res
        );
    } catch (error) {
        console.error("Error in createMilestoneController:", error);
        next(error);
    }
};

export const getActiveMilestoneController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const milestone = await getActiveMilestoneService(userId);
        successResponse(
            {
                success: true,
                message: milestone ? "Active milestone fetched" : "No active milestone found",
                data: milestone,
            },
            res
        );
    } catch (error) {
        console.error("Error in getActiveMilestoneController:", error);
        next(error);
    }
};

export const completeMilestoneController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const milestone = await completeMilestoneService(userId, id);
        successResponse(
            {
                success: true,
                message: "Milestone completed successfully",
                data: milestone,
            },
            res
        );
    } catch (error) {
        console.error("Error in completeMilestoneController:", error);
        next(error);
    }
};

export const cancelMilestoneController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params; // optional id if passed
        const milestone = await cancelMilestoneService(userId, id);
        successResponse(
            {
                success: true,
                message: "Milestone cancelled successfully",
                data: milestone,
            },
            res
        );
    } catch (error) {
        console.error("Error in cancelMilestoneController:", error);
        next(error);
    }
};
