import { Request, Response } from 'express';
import { query } from '../config/db.js';

// Listar todos os parceiros
export const getAllPartners = async (req: Request, res: Response) => {
    try {
        const { rows } = await query('SELECT * FROM partners ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar parceiros:', error);
        res.status(500).json({ error: 'Erro interno ao buscar parceiros' });
    }
};

// Obter um parceiro por ID
export const getPartnerById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { rows } = await query('SELECT * FROM partners WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parceiro não encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar parceiro:', error);
        res.status(500).json({ error: 'Erro interno ao buscar parceiro' });
    }
};

// Criar novo parceiro
export const createPartner = async (req: Request, res: Response) => {
    const {
        company_name,
        category,
        address,
        contact_info,
        percentage,
        contact_email,
        contact_phone,
        notes,
        contract_url,
        created_by
    } = req.body;

    try {
        const { rows } = await query(
            `INSERT INTO partners (
        company_name, category, address, contact_info, percentage, 
        contact_email, contact_phone, notes, contract_url, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                company_name, category, address, contact_info, percentage,
                contact_email, contact_phone, notes, contract_url, created_by
            ]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erro ao criar parceiro:', error);
        res.status(500).json({ error: 'Erro ao criar parceiro' });
    }
};

// Atualizar parceiro
export const updatePartner = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // Lista de campos permitidos para atualização
    const ALLOWED_FIELDS = [
        'company_name', 'category', 'address', 'contact_info',
        'percentage', 'contact_email', 'contact_phone', 'notes',
        'contract_url', 'approval_status', 'document_status',
        'logo_url', 'description', 'city'
    ];

    // Filtrar apenas campos permitidos e remover updated_at se vier no body
    const fields = Object.keys(updates).filter(key =>
        ALLOWED_FIELDS.includes(key) && key !== 'updated_at' && key !== 'id'
    );
    const values = fields.map(key => updates[key]);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    try {
        const { rows } = await query(
            `UPDATE partners SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parceiro não encontrado' });
        }

        res.json(rows[0]);
    } catch (error: any) {
        console.error('Erro ao atualizar parceiro:', error);
        // Retornar detalhes do erro para facilitar debug (remover em produção se necessário)
        res.status(500).json({
            error: 'Erro ao atualizar parceiro',
            details: error.message
        });
    }
};

// Deletar parceiro
export const deletePartner = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { rows } = await query('DELETE FROM partners WHERE id = $1 RETURNING id', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Parceiro não encontrado' });
        }
        res.json({ message: 'Parceiro removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar parceiro:', error);
        res.status(500).json({ error: 'Erro ao deletar parceiro' });
    }
};
