import { Router } from 'express';
import { getPublicCard } from '../controllers/publicController.js';

const router = Router();

router.get('/card/:barcode', getPublicCard);

export default router;
