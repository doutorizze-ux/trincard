-- Verificar o status atual do usuário admin
SELECT 
    id,
    email,
    full_name,
    is_admin,
    is_active,
    created_at,
    updated_at
FROM users 
WHERE email = 'admin@trincard.com.br';

-- Verificar se existe algum usuário com is_admin = true
SELECT 
    id,
    email,
    is_admin
FROM users 
WHERE is_admin = true;