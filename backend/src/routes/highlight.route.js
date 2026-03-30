import express from 'express';
import {
    saveHighlight,
    getHighlightsByBook,
    deleteHighlight
} from '../controller/highlight.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, saveHighlight);
router.get('/:bookId', verifyToken, getHighlightsByBook);
router.delete('/:id', verifyToken, deleteHighlight);

export default router;
