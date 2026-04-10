import Comment from '../model/comment.model.js';

export const addCommentService = async (bookId, userId, content) => {
    try {
        const comment = await Comment.create({
            bookId,
            userId,
            content
        });
        
        // Populate user info so the frontend knows who wrote it immediately
        return await Comment.findById(comment._id).populate('userId', 'fullName picture');
    } catch (error) {
        throw error;
    }
};

export const getCommentsByBookService = async (bookId) => {
    try {
        return await Comment.find({ bookId, isDeleted: false })
            .populate('userId', 'fullName picture')
            .sort({ createdAt: -1 }); // Newest first
    } catch (error) {
        throw error;
    }
};

export const deleteCommentService = async (commentId, userId) => {
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) return null;
        
        // Only allow the author to delete their own comment
        if (comment.userId.toString() !== userId.toString()) {
            throw new Error('Unauthorized to delete this comment');
        }
        
        return await Comment.findByIdAndUpdate(commentId, { isDeleted: true }, { new: true });
    } catch (error) {
        throw error;
    }
};
