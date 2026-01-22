-- Debug script para verificar políticas RLS e testar DELETE na tabela partners

-- 1. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'partners';

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'partners';

-- 3. Verificar dados existentes na tabela
SELECT id, company_name, approval_status, created_at 
FROM partners 
ORDER BY created_at DESC;

-- 4. Testar se conseguimos fazer SELECT (para verificar permissões básicas)
SELECT COUNT(*) as total_partners FROM partners;

-- 5. Verificar usuário atual e suas permissões
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 6. Verificar se existe algum parceiro para testar
-- (NÃO vamos deletar nada ainda, apenas verificar)
SELECT 
    id,
    company_name,
    'Parceiro disponível para teste de deleção' as status
FROM partners 
LIMIT 1;