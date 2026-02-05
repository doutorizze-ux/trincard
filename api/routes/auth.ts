import { Router } from 'express';
import { login, register, getMe, updateMe, updatePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/update', authenticateToken, updateMe);
router.put('/password', authenticateToken, updatePassword);

export default router;