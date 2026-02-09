import { Router } from 'express';
import { getFinancialSummary } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas as rotas de admin precisam de autenticação
router.get('/financial-summary', authenticateToken, getFinancialSummary);

export default router;
