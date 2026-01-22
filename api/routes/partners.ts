import { Router } from 'express';
import {
    getAllPartners,
    getPartnerById,
    createPartner,
    updatePartner,
    deletePartner
} from '../controllers/partnersController.js';

const router = Router();

// Endpoint: /api/partners
router.get('/', getAllPartners);
router.get('/:id', getPartnerById);
router.post('/', createPartner);
router.put('/:id', updatePartner);
router.delete('/:id', deletePartner);

export default router;
