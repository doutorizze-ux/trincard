import { Router } from 'express';
import { handleAsaasWebhook } from '../controllers/webhookController.js';

const router = Router();

// Rota pública para receber avisos do Asaas
router.post('/asaas', handleAsaasWebhook);

export default router;
