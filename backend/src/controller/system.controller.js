import systemModel from "../model/system.model.js";
import successResponse from "../utils/success.response.js";
import { AppError } from "../utils/error.js";

export const getSystemSettingsController = async (req, res, next) => {
    try {
        let settings = await systemModel.findOne();
        if (!settings) {
            settings = await systemModel.create({});
        }
        successResponse({
            success: true,
            message: "System settings fetched successfully",
            data: settings
        }, res);
    } catch (error) {
        console.error("Error in getSystemSettingsController:", error);
        next(error);
    }
};

export const updateSystemSettingsController = async (req, res, next) => {
    try {
        const updateData = req.body;
        let settings = await systemModel.findOne();
        
        if (!settings) {
            settings = await systemModel.create(updateData);
        } else {
            settings = await systemModel.findOneAndUpdate({}, updateData, { new: true, runValidators: true });
        }

        successResponse({
            success: true,
            message: "System settings updated successfully",
            data: settings
        }, res);
    } catch (error) {
        console.error("Error in updateSystemSettingsController:", error);
        next(error);
    }
};
