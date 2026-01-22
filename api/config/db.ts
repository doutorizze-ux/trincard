// @ts-ignore
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Log de erros do pool
pool.on('error', (err, client) => {
    console.error('Erro inesperado no cliente do banco de dados', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
