import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
};

export const getPlanById = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar plano' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    const { name, price, description, features, is_active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO plans (name, price, description, features, is_active) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, price, description, JSON.stringify(features), is_active ?? true]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar plano' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    const { name, price, description, features, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE plans SET name = $1, price = $2, description = $3, features = $4, is_active = $5 
       WHERE id = $6 RETURNING *`,
            [name, price, description, JSON.stringify(features), is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar plano' });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar plano' });
    }
};
