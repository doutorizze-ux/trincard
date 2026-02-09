import { type Request, type Response } from 'express';
// @ts-ignore
import pool from '../config/db.js';

export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        // Garantir que é admin (middleware de autenticação já deve ter setado req.user)
        const user = (req as any).user;
        if (!user || user.role !== 'admin' && !user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // 1. Receita Total
        const totalRevenueResult = await pool.query(`
            SELECT SUM(amount) as total FROM payments WHERE status = 'completed'
        `);
        const totalRevenue = totalRevenueResult.rows[0].total || 0;

        // 2. Receita Mensal (Mês Atual)
        const monthlyRevenueResult = await pool.query(`
            SELECT SUM(amount) as total FROM payments 
            WHERE status = 'completed' 
            AND date_trunc('month', paid_at) = date_trunc('month', CURRENT_DATE)
        `);
        const monthlyRevenue = monthlyRevenueResult.rows[0].total || 0;

        // 3. Receita por Método de Pagamento
        const methodRevenueResult = await pool.query(`
            SELECT payment_method, SUM(amount) as total, COUNT(*) as count
            FROM payments 
            WHERE status = 'completed'
            GROUP BY payment_method
        `);

        // 4. Receita por Plano
        const planRevenueResult = await pool.query(`
            SELECT pl.name as plan_name, SUM(p.amount) as total, COUNT(p.id) as count
            FROM payments p
            JOIN subscriptions s ON p.subscription_id = s.id
            JOIN plans pl ON s.plan_id = pl.id
            WHERE p.status = 'completed'
            GROUP BY pl.name
        `);

        // 5. Histórico de Transações Recentes (com nomes de usuários)
        const recentTransactionsResult = await pool.query(`
            SELECT p.*, u.full_name as user_name, pl.name as plan_name
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN subscriptions s ON p.subscription_id = s.id
            JOIN plans pl ON s.plan_id = pl.id
            ORDER BY p.created_at DESC
            LIMIT 50
        `);

        // 6. Dados para Gráfico (últimos 6 meses)
        const chartDataResult = await pool.query(`
            SELECT 
                to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
                SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY month
            ORDER BY month ASC
        `);

        res.json({
            summary: {
                totalRevenue,
                monthlyRevenue,
                activeSubscriptions: 0, // Pode vir de outro lugar se necessário
            },
            methodRevenue: methodRevenueResult.rows,
            planRevenue: planRevenueResult.rows,
            recentTransactions: recentTransactionsResult.rows,
            chartData: chartDataResult.rows
        });

    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
    }
};
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'admin' && !user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        await pool.query('DELETE FROM payments WHERE id = $1', [id]);
        res.json({ success: true, message: 'Pagamento excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Erro ao excluir pagamento' });
    }
};

export const deleteSubscription = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'admin' && !user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;

        // Primeiro precisamos apagar pagamentos vinculados a esta assinatura (ou setar NULL)
        // Por segurança do histórico financeiro, vamos apagar apenas se solicitado ou garantir a integridade.
        // Aqui vamos apagar os pagamentos vinculados para permitir a exclusão da assinatura.
        await pool.query('DELETE FROM payments WHERE subscription_id = $1', [id]);
        await pool.query('DELETE FROM subscriptions WHERE id = $1', [id]);

        res.json({ success: true, message: 'Assinatura e pagamentos vinculados excluídos' });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        res.status(500).json({ error: 'Erro ao excluir assinatura' });
    }
};
