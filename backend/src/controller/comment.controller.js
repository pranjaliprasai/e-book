import { 
    addCommentService, 
    getCommentsByBookService, 
    deleteCommentService 
} from '../service/comment.service.js';
import successResponse from '../utils/success.response.js';
import { AppError } from '../utils/error.js';

export const addCommentController = async (req, res, next) => {
    try {
        const { bookId, content } = req.body;
        const userId = req.user.userId;

        if (!bookId || !content) {
            throw new AppError('Book ID and content are required', 400);
        }

        const comment = await addCommentService(bookId, userId, content);

        successResponse({
            success: true,
            message: 'Comment added successfully',
            data: comment
        }, res);
    } catch (error) {
        next(error);
    }
};

export const getCommentsByBookController = async (req, res, next) => {
    try {
        const { bookId } = req.params;

        if (!bookId) {
            throw new AppError('Book ID is required', 400);
        }

        const comments = await getCommentsByBookService(bookId);

        successResponse({
            success: true,
            message: 'Comments fetched successfully',
            count: comments.length,
            data: comments
        }, res);
    } catch (error) {
        next(error);
    }
};

export const deleteCommentController = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const result = await deleteCommentService(commentId, userId);

        if (!result) {
            throw new AppError('Comment not found', 404);
        }

        successResponse({
            success: true,
            message: 'Comment deleted successfully',
            data: null
        }, res);
    } catch (error) {
        next(error);
    }
};
