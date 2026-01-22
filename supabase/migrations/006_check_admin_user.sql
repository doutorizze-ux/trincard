-- Verificar se o usuário admin existe e tem is_admin = true
SELECT id, email, is_admin, created_at 
FROM users 
WHERE email = 'admin@trincard.com.br';

-- Se não existir ou is_admin for false, corrigir
INSERT INTO users (id, email, full_name, phone, cpf, address, card_type, is_active, is_admin)
SELECT 
    gen_random_uuid(),
    'admin@trincard.com.br',
    'Administrador',
    '',
    '',
    '{"street": "", "city": "", "state": "", "zip_code": ""}'::jsonb,
    'digital',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@trincard.com.br'
);

-- Garantir que o admin tenha is_admin = true
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@trincard.com.br' AND is_admin = false;

-- Verificar novamente
SELECT id, email, is_admin, created_at 
FROM users 
WHERE email = 'admin@trincard.com.br';