-- Verificar e garantir que o usuário admin@trincard.com.br existe e é admin
-- Esta migração garante que o usuário admin tenha acesso ao painel administrativo

-- Primeiro, verificar se o usuário existe
DO $$
BEGIN
    -- Se o usuário não existir, criar
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@trincard.com.br') THEN
        INSERT INTO users (
            id,
            email,
            full_name,
            phone,
            cpf,
            address,
            card_type,
            is_active,
            is_admin,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'admin@trincard.com.br',
            'Administrador TrinCard',
            '(11) 99999-9999',
            '000.000.000-00',
            '{"street": "", "city": "", "state": "", "zip_code": ""}'::jsonb,
            'digital',
            true,
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Usuário admin@trincard.com.br criado com sucesso!';
    ELSE
        -- Se existir, garantir que is_admin = true
        UPDATE users 
        SET is_admin = true, updated_at = NOW()
        WHERE email = 'admin@trincard.com.br' AND is_admin = false;
        
        IF FOUND THEN
            RAISE NOTICE 'Usuário admin@trincard.com.br atualizado para administrador!';
        ELSE
            RAISE NOTICE 'Usuário admin@trincard.com.br já é administrador!';
        END IF;
    END IF;
END $$;

-- Verificar o resultado final
SELECT 
    id,
    email,
    full_name,
    is_admin,
    is_active,
    created_at
FROM users 
WHERE email = 'admin@trincard.com.br';