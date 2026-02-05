import { Router } from 'express';
import { createCheckout } from '../controllers/checkoutController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticateToken, createCheckout);

export default router;
