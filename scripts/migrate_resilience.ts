
import pool from '../api/config/db';

async function migrate() {
    try {
        console.log('Iniciando migração de resiliência...');

        // 1. Adicionar coluna gateway_id na tabela subscriptions
        try {
            await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gateway_id text;`);
            console.log('Coluna gateway_id adicionada.');
        } catch (e) {
            console.log('Erro ao adicionar gateway_id (pode já existir):', e);
        }

        // 2. Atualizar constraint de status para permitir 'pending'
        try {
            await pool.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;`);
            await pool.query(`
                ALTER TABLE subscriptions 
                ADD CONSTRAINT subscriptions_status_check 
                CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled', 'pending'));
            `);
            console.log('Constraint de status atualizada.');
        } catch (e) {
            console.error('Erro ao atualizar constraint de status:', e);
        }

        console.log('Migração concluída com sucesso.');
        process.exit(0);
    } catch (error) {
        console.error('Erro geral na migração:', error);
        process.exit(1);
    }
}

migrate();
