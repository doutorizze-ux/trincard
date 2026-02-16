import { Router } from 'express';
import { getAllSubscriptions, getUserSubscription, activateFreeSubscription, cancelSubscription, getUserPayments, emergencyFixDates } from '../controllers/subscriptionsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getAllSubscriptions);
router.get('/me', authenticateToken, getUserSubscription);
router.get('/payments', authenticateToken, getUserPayments);
router.post('/activate-free', authenticateToken, activateFreeSubscription);
router.get('/fix-dates-now', emergencyFixDates); // Temporário para correção imediata
router.delete('/:id', authenticateToken, cancelSubscription);

export default router;
