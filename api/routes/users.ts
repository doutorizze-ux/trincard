import { Router } from 'express';
import { getAllUsers } from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getAllUsers);

export default router;
