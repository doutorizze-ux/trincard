-- Migração simples para sincronizar usuários existentes
-- Resolve problema de carregamento infinito

-- Primeiro, vamos verificar se há usuários no auth.users sem entrada na tabela users
DO $$
DECLARE
    auth_user_record RECORD;
    user_count INTEGER := 0;
BEGIN
    -- Contar usuários órfãos
    SELECT COUNT(*) INTO user_count
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
    
    RAISE NOTICE 'Encontrados % usuários sem perfil na tabela users', user_count;
    
    -- Se há usuários órfãos, vamos sincronizá-los
    IF user_count > 0 THEN
        FOR auth_user_record IN 
            SELECT au.id, au.email, au.created_at
            FROM auth.users au
            LEFT JOIN public.users pu ON au.id = pu.id
            WHERE pu.id IS NULL
        LOOP
            -- Inserir usuário com dados mínimos
            INSERT INTO public.users (
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
                auth_user_record.id,
                auth_user_record.email,
                'Usuário',
                '',
                'TEMP_' || SUBSTRING(REPLACE(auth_user_record.id::text, '-', ''), 1, 11),
                '{"street": "", "city": "", "state": "", "zip_code": ""}'::jsonb,
                'digital',
                true,
                CASE WHEN auth_user_record.email = 'admin@trincard.com.br' THEN true ELSE false END,
                auth_user_record.created_at,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                is_admin = CASE WHEN EXCLUDED.email = 'admin@trincard.com.br' THEN true ELSE users.is_admin END,
                updated_at = NOW();
            
            RAISE NOTICE 'Sincronizado: % (%)', auth_user_record.email, auth_user_record.id;
        END LOOP;
    END IF;
    
    -- Verificar se admin@trincard.com.br está marcado como admin
    UPDATE public.users 
    SET is_admin = true, updated_at = NOW()
    WHERE email = 'admin@trincard.com.br' AND is_admin = false;
    
    IF FOUND THEN
        RAISE NOTICE 'Admin user atualizado: admin@trincard.com.br';
    END IF;
END;
$$;

-- Verificar resultado final
DO $$
DECLARE
    total_auth_users INTEGER;
    total_profile_users INTEGER;
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    SELECT COUNT(*) INTO total_profile_users FROM public.users;
    SELECT COUNT(*) INTO admin_count FROM public.users WHERE is_admin = true;
    
    RAISE NOTICE 'Usuários no auth.users: %', total_auth_users;
    RAISE NOTICE 'Usuários na tabela users: %', total_profile_users;
    RAISE NOTICE 'Administradores: %', admin_count;
END;
$$;