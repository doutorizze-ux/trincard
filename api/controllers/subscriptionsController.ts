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
