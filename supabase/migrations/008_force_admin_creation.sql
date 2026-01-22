-- Forçar criação do usuário admin se não existir
DO $$
BEGIN
    -- Verificar se o usuário admin já existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@trincard.com.br') THEN
        -- Criar o usuário admin
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
            '',
            '',
            '{"street": "", "city": "", "state": "", "zip_code": ""}'::jsonb,
            'digital',
            true,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuário admin criado com sucesso!';
    ELSE
        -- Garantir que o usuário existente seja admin
        UPDATE users 
        SET 
            is_admin = true,
            updated_at = NOW()
        WHERE email = 'admin@trincard.com.br' AND is_admin = false;
        
        RAISE NOTICE 'Usuário admin já existe e foi atualizado!';
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