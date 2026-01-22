-- Corrigir políticas RLS para DELETE na tabela partners

-- 1. Primeiro, vamos ver as políticas atuais
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'partners';

-- 2. Remover todas as políticas existentes para DELETE
DROP POLICY IF EXISTS "Allow authenticated users to delete partners" ON partners;
DROP POLICY IF EXISTS "partners_delete_policy" ON partners;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON partners;

-- 3. Criar uma nova política mais permissiva para DELETE
CREATE POLICY "partners_delete_authenticated" ON partners
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Garantir que RLS está habilitado
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se a política foi criada corretamente
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    'Nova política DELETE' as status
FROM pg_policies 
WHERE tablename = 'partners' AND cmd = 'DELETE';

-- 6. Testar se conseguimos fazer SELECT (para garantir que outras operações funcionam)
SELECT 
    COUNT(*) as total_partners,
    'Teste SELECT após ajuste RLS' as status
FROM partners;