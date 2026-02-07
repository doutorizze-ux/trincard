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
        const featuresJson = typeof features === 'string' ? features : JSON.stringify(features);

        const result = await pool.query(
            `UPDATE plans SET name = COALESCE($1, name), price = COALESCE($2, price), description = COALESCE($3, description), features = COALESCE($4, features), is_active = COALESCE($5, is_active) 
       WHERE id = $6 RETURNING *`,
            [name, price, description, featuresJson, is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({
            error: 'Erro ao atualizar plano',
            details: error.message || String(error)
        });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        // Verificar dependências antes de deletar
        // Se houver assinaturas vinculadas a este plano, não podemos deletar diretamente
        // O ideal é arquivar (is_active = false)

        const subscriptionsCheck = await pool.query('SELECT count(*) FROM subscriptions WHERE plan_id = $1', [req.params.id]);
        if (parseInt(subscriptionsCheck.rows[0].count) > 0) {
            console.log(`Plano ${req.params.id} tem assinaturas ativas. Arquivando em vez de deletar.`);
            const result = await pool.query('UPDATE plans SET is_active = false WHERE id = $1 RETURNING *', [req.params.id]);
            return res.json({ success: true, message: 'Plano arquivado pois possui assinaturas vinculadas', plan: result.rows[0] });
        }

        const result = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao deletar plano:', error);
        res.status(500).json({
            error: 'Erro ao deletar plano',
            details: error.message || String(error)
        });
    }
};
