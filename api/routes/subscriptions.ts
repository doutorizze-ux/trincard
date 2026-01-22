import { Router } from 'express';
import { getAllSubscriptions, getUserSubscription, activateFreeSubscription } from '../controllers/subscriptionsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getAllSubscriptions);
router.get('/me', authenticateToken, getUserSubscription);
router.post('/activate-free', authenticateToken, activateFreeSubscription);

export default router;
