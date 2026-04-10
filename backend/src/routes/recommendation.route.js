import express from 'express';
import { getBookRecommendations } from '../controller/recommendation.controller.js';

const router = express.Router();

router.get('/:bookId', getBookRecommendations);

export default router;
