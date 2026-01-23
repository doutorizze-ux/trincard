import { Router } from 'express';
import { login, register, getMe, updateMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/update', authenticateToken, updateMe);

export default router;