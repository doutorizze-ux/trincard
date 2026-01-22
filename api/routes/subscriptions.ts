import { Router } from 'express';
import { getAllSubscriptions, getUserSubscription } from '../controllers/subscriptionsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getAllSubscriptions);
router.get('/me', authenticateToken, getUserSubscription);

export default router;
