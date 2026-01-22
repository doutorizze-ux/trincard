-- Verificar resultado do teste DELETE

-- 1. Verificar se ainda existem parceiros de teste
SELECT 
    id,
    company_name,
    created_at,
    'Parceiro de teste ainda existe' as status
FROM partners 
WHERE company_name = 'Empresa Teste DELETE';

-- 2. Contar total de parceiros
SELECT 
    COUNT(*) as total_parceiros,
    'Total de parceiros na tabela' as info
FROM partners;

-- 3. Verificar últimos parceiros criados
SELECT 
    id,
    company_name,
    approval_status,
    created_at
FROM partners 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar políticas RLS específicas para DELETE
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    'Política RLS para DELETE' as tipo
FROM pg_policies 
WHERE tablename = 'partners' AND cmd = 'DELETE';