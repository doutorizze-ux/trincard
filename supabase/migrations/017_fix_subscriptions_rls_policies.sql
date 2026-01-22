-- Corrigir políticas RLS para a tabela subscriptions
-- O problema é que a migração 011 removeu políticas de INSERT mas não as recriou adequadamente

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions or admin can view all" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions or admin can update all" ON subscriptions;

-- Criar políticas RLS corrigidas para subscriptions
-- Permitir que usuários vejam suas próprias assinaturas ou admin veja todas
CREATE POLICY "Users can view own subscriptions or admin can view all" ON subscriptions
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR is_admin_user()
    );

-- Permitir que usuários insiram suas próprias assinaturas
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

-- Permitir que usuários atualizem suas próprias assinaturas ou admin atualize todas
CREATE POLICY "Users can update own subscriptions or admin can update all" ON subscriptions
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR is_admin_user()
    );

-- Permitir que admin delete assinaturas
CREATE POLICY "Admin can delete subscriptions" ON subscriptions
    FOR DELETE USING (is_admin_user());

-- Comentário: Esta migração corrige o problema de RLS na tabela subscriptions
-- garantindo que usuários possam criar suas próprias assinaturas