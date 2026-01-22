-- Migração para sincronizar auth.users com a tabela users
-- Garante que todos os usuários autenticados tenham perfil na tabela users

-- Função para sincronizar usuários do auth com a tabela users
CREATE OR REPLACE FUNCTION sync_auth_users()
RETURNS void AS $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Iterar sobre todos os usuários do auth.users que não estão na tabela users
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
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
            COALESCE(auth_user.raw_user_meta_data->>'cpf', ''),
            COALESCE(
                auth_user.raw_user_meta_data->'address',
                '{"street": "", "city": "", "state": "", "zip_code": ""}'
            )::jsonb,
            'digital',
            true,
            CASE WHEN auth_user.email = 'admin@trincard.com.br' THEN true ELSE false END
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuário sincronizado: % (%)', auth_user.email, auth_user.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a sincronização
SELECT sync_auth_users();

-- Criar trigger para sincronização automática de novos usuários
CREATE OR REPLACE FUNCTION auto_sync_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
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

-- Criar trigger na tabela auth.users (se possível)
-- Nota: Este trigger pode não funcionar dependendo das permissões do Supabase
-- Neste caso, a sincronização será feita pelo código da aplicação
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trigger_auto_sync_user ON auth.users;
        CREATE TRIGGER trigger_auto_sync_user
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION auto_sync_new_user();
        RAISE NOTICE 'Trigger de sincronização automática criado';
    ELSE
        RAISE NOTICE 'Tabela auth.users não acessível, sincronização será manual';
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permissões insuficientes para criar trigger em auth.users';
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION sync_auth_users() IS 'Sincroniza usuários do auth.users com a tabela public.users';
COMMENT ON FUNCTION auto_sync_new_user() IS 'Trigger para sincronização automática de novos usuários';