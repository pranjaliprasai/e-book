import Highlight from '../model/highlight.model.js';
import successResponse from '../utils/success.response.js';
import { AppError } from '../utils/error.js';

/**
 * Save a new highlight
 */
export const saveHighlight = async (req, res, next) => {
    try {
        const { bookId, text, rangeData, color } = req.body;
        const userId = req.user.userId;

        if (!bookId || !text || !rangeData) {
            throw new AppError('Book ID, text, and range data are required', 400);
        }

        const highlight = await Highlight.create({
            userId,
            bookId,
            text,
            rangeData,
            color
        });

        successResponse({
            success: true,
            message: 'Highlight saved successfully',
            data: highlight
        }, res);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all highlights for a specific book and user
 */
export const getHighlightsByBook = async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.userId;

        if (!bookId || bookId === 'null' || bookId === 'undefined') {
            throw new AppError('A valid Book ID is required', 400);
        }

        const highlights = await Highlight.find({ userId, bookId }).sort({ createdAt: 1 });

        successResponse({
            success: true,
            data: highlights
        }, res);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a highlight
 */
export const deleteHighlight = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!id || id === 'null' || id === 'undefined') {
            throw new AppError('A valid highlight ID is required', 400);
        }

        const result = await Highlight.findOneAndDelete({ _id: id, userId });

        if (!result) {
            throw new AppError('Highlight not found or unauthorized', 404);
        }

        successResponse({
            success: true,
            message: 'Highlight deleted successfully'
        }, res);
    } catch (error) {
        next(error);
    }
};
