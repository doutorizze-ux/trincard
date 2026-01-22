import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, full_name, email, role, is_active FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};
