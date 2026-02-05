import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const handleAsaasWebhook = async (req: Request, res: Response) => {
    const { event, payment } = req.body;

    console.log('--- NOVO EVENTO WEBHOOK ASAAS ---');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Evento:', event);
    console.log('ExternalReference:', payment?.externalReference);
    console.log('Webhook Token no ENV:', process.env.ASAAS_WEBHOOK_TOKEN ? 'Configurado' : 'AUSENTE');

    // 1. Validar Token de Segurança do Webhook (Configurado no Painel do Asaas e no .env)
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = req.headers['asaas-access-token'];

    if (webhookToken && receivedToken !== webhookToken) {
        console.error('ERRO: Token do Webhook não bate!', { recebido: receivedToken, esperado: webhookToken });
        return res.status(401).json({ error: 'Não autorizado' });
    }

    // Eventos que indicam pagamento confirmado
    const successEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];

    if (successEvents.includes(event)) {
        // Se enviamos "userId:planId" no externalReference para garantir
        const parts = payment.externalReference?.split(':') || [];
        const actualUserId = parts[0];
        const actualPlanId = parts[1];

        if (!actualUserId || !actualPlanId) {
            console.error('Webhook: Dados do usuário ou plano não encontrados no externalReference', payment?.externalReference);
            return res.status(400).json({ error: 'Referência externa inválida' });
        }

        try {
            // 2. Iniciar transação no banco
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 2.1 Buscar detalhes do plano para calcular a duração exata
                const planResult = await client.query('SELECT name FROM plans WHERE id = $1', [actualPlanId]);
                const planName = planResult.rows[0]?.name || '';

                let durationDays = 30; // Padrão Mensal
                if (planName.toLowerCase().includes('anual')) {
                    durationDays = 365;
                } else if (planName.toLowerCase().includes('semestral')) {
                    durationDays = 180;
                } else if (planName.toLowerCase().includes('trimestral')) {
                    durationDays = 90;
                }

                // 3. Cancelar assinaturas ativas anteriores para evitar duplicidade
                await client.query(
                    "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'",
                    [actualUserId]
                );

                // 4. Calcular datas com precisão
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + durationDays);

                const startDateIso = startDate.toISOString();
                const endDateIso = endDate.toISOString();

                // 5. Gerar código de barras único
                const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

                // 6. Criar nova assinatura ativa
                const insertSubQuery = `
                    INSERT INTO subscriptions (
                        user_id, plan_id, status, barcode, due_date, start_date, end_date, created_at, updated_at
                    )
                    VALUES ($1, $2, 'active', $3, $4, $5, $6, NOW(), NOW())
                    RETURNING id
                `;
                const subResult = await client.query(insertSubQuery, [
                    actualUserId, actualPlanId, barcode, endDateIso, startDateIso, endDateIso
                ]);

                // 7. Registrar o pagamento
                const insertPaymentQuery = `
                    INSERT INTO payments (
                        subscription_id, user_id, amount, payment_method, status, transaction_id, paid_at, created_at
                    )
                    VALUES ($1, $2, $3, $4, 'completed', $5, NOW(), NOW())
                `;

                const methodMap: Record<string, string> = {
                    'PIX': 'pix',
                    'CREDIT_CARD': 'credit_card',
                    'BOLETO': 'debit_card' // Aproximação
                };

                await client.query(insertPaymentQuery, [
                    subResult.rows[0].id,
                    actualUserId,
                    payment.value,
                    methodMap[payment.billingType] || 'pix',
                    payment.id
                ]);

                await client.query('COMMIT');
                console.log(`✅ Assinatura ativada via Webhook para o usuário: ${actualUserId}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Erro ao processar Webhook do Asaas:', error);
            return res.status(500).json({ error: 'Erro interno ao processar pagamento' });
        }
    }

    // Retornar 200 sempre para o Asaas não ficar tentando reenviar
    res.status(200).json({ success: true });
};
