import { query } from '../api/config/db';

async function fixDb() {
    try {
        console.log('--- Iniciando Correção do Banco de Dados ---');

        console.log('Verificando e adicionando coluna "description"...');
        await query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS description TEXT;');

        console.log('Verificando e adicionando coluna "city"...');
        await query('ALTER TABLE partners ADD COLUMN IF NOT EXISTS city TEXT;');

        console.log('--- Banco de Dados Atualizado com Sucesso! ---');
        process.exit(0);
    } catch (error) {
        console.error('!!! Erro ao atualizar banco de dados !!!');
        console.error(error);
        process.exit(1);
    }
}

fixDb();
