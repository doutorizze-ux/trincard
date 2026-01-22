import { Router } from 'express';
import { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan } from '../controllers/plansController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public route to view plans? Or protected? Assuming public for now or authenticated
router.get('/', getAllPlans);
router.get('/:id', getPlanById);

// Protected routes (Admin only ideally, but using auth for now)
router.post('/', authenticateToken, createPlan);
router.put('/:id', authenticateToken, updatePlan);
router.delete('/:id', authenticateToken, deletePlan);

export default router;
