import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getPublicCard = async (req: Request, res: Response) => {
    const { barcode } = req.params;

    if (!barcode) {
        return res.status(400).json({ error: 'Código do cartão é obrigatório' });
    }

    try {
        const query = `
            SELECT 
                s.barcode,
                s.status,
                s.end_date,
                u.full_name as user_name,
                u.profile_photo_url,
                p.name as plan_name
            FROM subscriptions s
            JOIN users u ON s.user_id = u.id
            JOIN plans p ON s.plan_id = p.id
            WHERE s.barcode = $1
            LIMIT 1
        `;

        const result = await pool.query(query, [barcode]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cartão não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar cartão público:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
