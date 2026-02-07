import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, full_name, email, phone, role, is_active, card_type, is_admin, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { full_name, role, is_active, is_admin, card_type } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users 
             SET full_name = $1, role = $2, is_active = $3, is_admin = $4, card_type = $5, updated_at = NOW() 
             WHERE id = $6 RETURNING *`,
            [full_name, role, is_active, is_admin, card_type, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            error: 'Erro ao atualizar usuário',
            details: error.message || String(error)
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Verificar se o usuário existe
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Antes de deletar usuário, precisamos lidar com as dependências (assinaturas, etc)
        // Por segurança, vamos apenas desativar em vez de deletar fisicamente se houver vínculos, 
        // ou deletar em cascata se o banco permitir.

        // Ordem de deleção importa devido às foreign keys
        // 1. Deletar pagamentos (que podem depender de assinaturas e usuários)
        await pool.query('DELETE FROM payments WHERE user_id = $1', [id]);

        // 2. Deletar assinaturas (que dependem de usuários) - se pagamentos dependem de assinaturas, eles já foram
        await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [id]);

        // 3. Deletar uso de benefícios
        await pool.query('DELETE FROM benefit_usage WHERE user_id = $1', [id]);

        // 4. Finalmente, deletar o usuário
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou já deletado' });
        }

        res.json({ success: true, message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
        console.error('Erro ao deletar usuário:', error);
        // Retornar mensagem detalhada para debug
        res.status(500).json({
            error: 'Erro ao deletar usuário',
            details: error.message || String(error)
        });
    }
};
