// @ts-ignore
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Log de erros do pool
pool.on('error', (err, client) => {
    console.error('Erro inesperado no cliente do banco de dados', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Função para garantir que as novas colunas existam no banco de dados.
 * Isso evita erros de "coluna não encontrada" após atualizações de código.
 */
export const ensureColumnsExist = async () => {
    try {
        console.log('--- Verificando integridade das tabelas ---');

        // 1. Adiciona colunas novas se não existirem
        await query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS description TEXT;');
        await query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS city TEXT;');
        await query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT;');

        // 2. Converte colunas JSON para TEXT para evitar erro de sintaxe
        // O "USING" garante que o conteúdo atual seja convertido para texto sem perda
        await query('ALTER TABLE partners ALTER COLUMN address TYPE TEXT USING address::TEXT;');
        await query('ALTER TABLE partners ALTER COLUMN contact_info TYPE TEXT USING contact_info::TEXT;');

        // 3. Garante que campos não sejam obrigatórios para evitar erros de salvamento parcial
        await query('ALTER TABLE partners ALTER COLUMN address DROP NOT NULL;');
        await query('ALTER TABLE partners ALTER COLUMN contact_info DROP NOT NULL;');
        await query('ALTER TABLE partners ALTER COLUMN category DROP NOT NULL;');

        console.log('--- Tabelas verificadas e convertidas com sucesso ---');
    } catch (error) {
        console.error('Erro ao verificar/converter colunas no banco:', error);
    }
};

export default pool;
