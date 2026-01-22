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
