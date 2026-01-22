-- Corrigir recursão infinita nas políticas RLS da tabela users
-- O problema está nas políticas que fazem consultas na própria tabela users

-- Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
DROP POLICY IF EXISTS "Admins can manage benefits" ON benefits;
DROP POLICY IF EXISTS "Admins can view all benefit usage" ON benefit_usage;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Criar função para verificar se o usuário atual é admin
-- Esta função evita a recursão usando auth.uid() diretamente
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar diretamente na tabela auth.users se o email é admin
    RETURN EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND au.email = 'admin@trincard.com.br'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS corrigidas para usuários
-- Usuários podem ver seu próprio perfil OU se for admin
CREATE POLICY "Users can view own profile or admin can view all" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text OR is_admin_user()
    );

-- Usuários podem atualizar seu próprio perfil OU se for admin
CREATE POLICY "Users can update own profile or admin can update all" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR is_admin_user()
    );

-- Políticas RLS corrigidas para assinaturas
CREATE POLICY "Users can view own subscriptions or admin can view all" ON subscriptions
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR is_admin_user()
    );

CREATE POLICY "Users can update own subscriptions or admin can update all" ON subscriptions
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR is_admin_user()
    );

-- Políticas RLS corrigidas para parceiros
CREATE POLICY "Admin can manage partners" ON partners
    FOR ALL USING (is_admin_user());

-- Políticas RLS corrigidas para benefícios
CREATE POLICY "Admin can manage benefits" ON benefits
    FOR ALL USING (is_admin_user());

-- Políticas RLS corrigidas para uso de benefícios
CREATE POLICY "Users can view own benefit usage or admin can view all" ON benefit_usage
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR is_admin_user()
    );

-- Políticas RLS corrigidas para pagamentos
CREATE POLICY "Users can view own payments or admin can view all" ON payments
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT user_id::text FROM subscriptions WHERE id = subscription_id
        ) OR is_admin_user()
    );

-- Comentário: Esta migração resolve o problema de recursão infinita
-- substituindo as consultas recursivas por uma função que verifica
-- diretamente na tabela auth.users usando o email do administrador