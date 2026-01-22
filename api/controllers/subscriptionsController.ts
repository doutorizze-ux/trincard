import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getAllSubscriptions = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT s.*, u.full_name as user_name, p.name as plan_name 
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON s.plan_id = p.id
    `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar assinaturas' });
    }
};

export const getUserSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await pool.query(`
            SELECT s.*, p.name as plan_name, p.price as plan_price, p.features as plan_features,
            json_build_object('name', p.name, 'price', p.price, 'features', p.features) as plans
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = $1 AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json(null);
        }
        res.json(result.rows[0]);
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

        if (Number(plan.price) > 0) {
            return res.status(400).json({ error: 'Este plano não é gratuito. Use o checkout normal.' });
        }

        // Deletar ou cancelar assinaturas ativas anteriores
        await pool.query(
            "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = $1 AND status = 'active'",
            [userId]
        );

        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
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
            startDate,
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
