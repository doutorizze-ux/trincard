import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getAllSubscriptions = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT s.*, 
            json_build_object('full_name', u.full_name, 'email', u.email) as users,
            json_build_object('name', p.name, 'price', p.price) as plans
            FROM subscriptions s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN plans p ON s.plan_id = p.id
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all subscriptions:', error);
        res.status(500).json({ error: 'Erro ao buscar assinaturas' });
    }
};

export const getUserSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Buscar assinatura ativa ou pendente (prioriza ativa se houver múltiplas, pelo order by status/created_at)
        // Mas a lógica abaixo pega a mais recente.
        const result = await pool.query(`
            SELECT s.*, p.name as plan_name, p.price as plan_price, p.features as plan_features,
            json_build_object('name', p.name, 'price', p.price, 'features', p.features) as plans
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = $1 AND (s.status = 'active' OR s.status = 'pending')
            ORDER BY 
                CASE WHEN s.status = 'active' THEN 1 ELSE 2 END,
                s.created_at DESC
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json(null);
        }

        const subscription = result.rows[0];

        // Fallback: Se for pendente e tiver gateway_id, verifica no Asaas se já pagou
        // Isso resolve atrasos no Webhook durante o lançamento
        if (subscription.status === 'pending' && subscription.gateway_id) {
            try {
                const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
                const ASAAS_URL = process.env.ASAAS_URL || process.env.ASAAS_API_URI || 'https://www.asaas.com/api/v3';

                if (ASAAS_API_KEY) {
                    console.log(`[Polling Fallback] Verificando status da assinatura ${subscription.gateway_id} no Asaas...`);
                    const response = await fetch(`${ASAAS_URL}/subscriptions/${subscription.gateway_id}/payments`, {
                        headers: { 'access_token': ASAAS_API_KEY }
                    });
                    const paymentsData: any = await response.json();

                    if (paymentsData.data && paymentsData.data.length > 0) {
                        const firstPayment = paymentsData.data[0];
                        const confirmedStatus = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

                        if (confirmedStatus.includes(firstPayment.status)) {
                            console.log(`[Polling Fallback] Pagamento confirmado no Asaas (${firstPayment.status}). Ativando localmente...`);

                            // Ativar a assinatura no banco (Lógica similar ao webhook mas simplificada para o registro específico)
                            await pool.query(`
                                UPDATE subscriptions 
                                SET status = 'active', updated_at = NOW() 
                                WHERE id = $1
                            `, [subscription.id]);

                            // Registrar o pagamento se não existir
                            const checkPayment = await pool.query('SELECT id FROM payments WHERE transaction_id = $1', [firstPayment.id]);
                            if (checkPayment.rows.length === 0) {
                                await pool.query(`
                                    INSERT INTO payments (subscription_id, user_id, amount, payment_method, status, transaction_id, paid_at, created_at)
                                    VALUES ($1, $2, $3, $4, 'completed', $5, NOW(), NOW())
                                `, [
                                    subscription.id,
                                    subscription.user_id,
                                    firstPayment.value,
                                    firstPayment.billingType?.toLowerCase() || 'credit_card',
                                    firstPayment.id
                                ]);
                            }

                            subscription.status = 'active'; // Atualiza objeto de retorno
                        }
                    }
                }
            } catch (pollError) {
                console.error('[Polling Fallback] Erro ao verificar status no Asaas:', pollError);
            }
        }

        res.json(subscription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar assinatura do usuário' });
    }
};

export const activateFreeSubscription = async (req: Request, res: Response) => {
    const { planId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!planId) {
        return res.status(400).json({ error: 'ID do plano é obrigatório' });
    }

    try {
        const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
        if (planResult.rows.length === 0) {
            return res.status(404).json({ error: 'Plano não encontrado' });
        }
        const plan = planResult.rows[0];
        const planName = plan.name || '';

        if (Number(plan.price) > 0) {
            return res.status(400).json({ error: 'Este plano não é gratuito. Use o checkout normal.' });
        }

        // Deletar ou cancelar assinaturas ativas anteriores
        await pool.query(
            "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'",
            [userId]
        );

        let durationDays = 30; // Padrão Mensal
        if (planName.toLowerCase().includes('anual')) {
            durationDays = 365;
        } else if (planName.toLowerCase().includes('semestral')) {
            durationDays = 180;
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + durationDays);

        const startDateIso = startDate.toISOString();
        const endDateIso = endDate.toISOString();

        // Gerar um código de barras aleatório de 12 dígitos
        const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

        const insertQuery = `
            INSERT INTO subscriptions (
                user_id, 
                plan_id, 
                status, 
                barcode,
                due_date,
                start_date, 
                end_date,
                created_at,
                updated_at
            )
            VALUES ($1, $2, 'active', $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;

        const insertResult = await pool.query(insertQuery, [
            userId,
            planId,
            barcode,
            endDateIso,
            startDateIso,
            endDateIso
        ]);

        console.log(`Plano gratuito ativado para o usuário ${userId}`);
        res.status(201).json(insertResult.rows[0]);

    } catch (error: any) {
        console.error('ERRO CRÍTICO AO ATIVAR PLANO GRATUITO:', {
            message: error.message,
            stack: error.stack,
            userId,
            planId
        });
        res.status(500).json({
            error: 'Erro interno ao ativar plano',
            details: error.message
        });
    }
};

export const cancelSubscription = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    try {
        const result = await pool.query(
            "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assinatura não encontrada ou não pertence ao usuário' });
        }

        res.json({ message: 'Assinatura cancelada com sucesso', subscription: result.rows[0] });
    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        res.status(500).json({ error: 'Erro ao cancelar assinatura' });
    }
};

export const getUserPayments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await pool.query(`
            SELECT p.*, pl.name as plan_name
            FROM payments p
            JOIN subscriptions s ON p.subscription_id = s.id
            JOIN plans pl ON s.plan_id = pl.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar pagamentos do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar faturas' });
    }
};

export const emergencyFixDates = async (req: Request, res: Response) => {
    try {
        console.log('--- Iniciando Correção Emergencial de Datas ---');

        // Identificar assinaturas criadas nos últimos 2 dias que vencem em menos de 2 dias de criadas
        const result = await pool.query(`
            SELECT s.id, p.name as plan_name, s.created_at
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.due_date <= s.created_at + interval '2 days'
            AND s.created_at >= NOW() - interval '2 days'
        `);

        let updatedCount = 0;
        for (const sub of result.rows) {
            let durationDays = 30;
            const name = (sub.plan_name || '').toLowerCase();
            if (name.includes('anual')) durationDays = 365;
            else if (name.includes('semestral')) durationDays = 180;
            else if (name.includes('trimestral')) durationDays = 90;

            const startDate = new Date(sub.created_at);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + durationDays);
            const endDateIso = endDate.toISOString();

            await pool.query(`
                UPDATE subscriptions 
                SET due_date = $1, end_date = $1, updated_at = NOW()
                WHERE id = $2
            `, [endDateIso, sub.id]);

            updatedCount++;
        }

        res.json({
            success: true,
            message: `Processado com sucesso. ${updatedCount} assinaturas corrigidas.`,
            found: result.rows.length,
            updated: updatedCount
        });
    } catch (error: any) {
        console.error('Erro na correção emergencial:', error);
        res.status(500).json({ error: 'Erro interno ao corrigir datas', details: error.message });
    }
};
