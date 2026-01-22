-- Migração para sincronizar auth.users com a tabela users (versão corrigida)
-- Resolve problema de CPF duplicado gerando valores únicos temporários

-- Função para gerar CPF temporário único
CREATE OR REPLACE FUNCTION generate_temp_cpf(user_id uuid)
RETURNS text AS $$
BEGIN
    -- Gera um CPF temporário baseado no UUID do usuário
    -- Formato: TEMP_[primeiros 11 dígitos do UUID sem hífens]
    RETURN 'TEMP_' || SUBSTRING(REPLACE(user_id::text, '-', ''), 1, 11);
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar usuários do auth com a tabela users
CREATE OR REPLACE FUNCTION sync_auth_users_fixed()
RETURNS void AS $$
DECLARE
    auth_user RECORD;
    temp_cpf text;
BEGIN
    -- Iterar sobre todos os usuários do auth.users que não estão na tabela users
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        -- Gerar CPF temporário único para este usuário
        temp_cpf := generate_temp_cpf(auth_user.id);
        
        -- Inserir usuário faltante na tabela users
        INSERT INTO public.users (
            id,
            email,
            full_name,
            phone,
            cpf,
            address,
            card_type,
            is_active,
            is_admin
        ) VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'full_name', 'Usuário'),
            COALESCE(auth_user.raw_user_meta_data->>'phone', ''),
            COALESCE(
                NULLIF(auth_user.raw_user_meta_data->>'cpf', ''),
                temp_cpf
            ),
            COALESCE(
                auth_user.raw_user_meta_data->'address',
                '{"street": "", "city": "", "state": "", "zip_code": ""}'
            )::jsonb,
            'digital',
            true,
            CASE WHEN auth_user.email = 'admin@trincard.com.br' THEN true ELSE false END
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuário sincronizado: % (%) - CPF: %', auth_user.email, auth_user.id, temp_cpf;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a sincronização
SELECT sync_auth_users_fixed();

-- Atualizar função de trigger para novos usuários
CREATE OR REPLACE FUNCTION auto_sync_new_user_fixed()
RETURNS TRIGGER AS $$
DECLARE
    temp_cpf text;
BEGIN
    -- Gerar CPF temporário único
    temp_cpf := generate_temp_cpf(NEW.id);
    
    -- Inserir automaticamente na tabela users quando um novo usuário é criado no auth
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        cpf,
        address,
        card_type,
        is_active,
        is_admin
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
            temp_cpf
        ),
        COALESCE(
            NEW.raw_user_meta_data->'address',
            '{"street": "", "city": "", "state": "", "zip_code": ""}'
        )::jsonb,
        'digital',
        true,
        CASE WHEN NEW.email = 'admin@trincard.com.br' THEN true ELSE false END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        is_admin = CASE WHEN EXCLUDED.email = 'admin@trincard.com.br' THEN true ELSE users.is_admin END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentários explicativos
COMMENT ON FUNCTION generate_temp_cpf(uuid) IS 'Gera CPF temporário único baseado no UUID do usuário';
COMMENT ON FUNCTION sync_auth_users_fixed() IS 'Sincroniza usuários do auth.users com a tabela public.users (versão corrigida)';
COMMENT ON FUNCTION auto_sync_new_user_fixed() IS '