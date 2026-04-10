import express from 'express';
import { 
    addCommentController, 
    getCommentsByBookController, 
    deleteCommentController 
} from '../controller/comment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Publicly viewable comments
router.get('/:bookId', getCommentsByBookController);

// Protected routes (must be logged in to comment or delete)
router.post('/', verifyToken, addCommentController);
router.delete('/:commentId', verifyToken, deleteCommentController);

export default router;
