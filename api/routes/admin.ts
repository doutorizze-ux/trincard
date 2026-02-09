import { Router } from 'express';
import { getFinancialSummary, deletePayment, deleteSubscription } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas as rotas de admin precisam de autenticação
router.get('/financial-summary', authenticateToken, getFinancialSummary);
router.delete('/payments/:id', authenticateToken, deletePayment);
router.delete('/subscriptions/:id', authenticateToken, deleteSubscription);

export default router;
