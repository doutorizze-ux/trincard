-- Adicionar campo is_admin à tabela users
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Criar função para tornar um usuário admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET is_admin = true WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tornar o usuário admin@trincard.com.br um administrador
-- (Esta linha será executada quando o usuário for criado)
-- SELECT make_user_admin('admin@trincard.com.br');

-- Adicionar políticas RLS para administradores
-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem atualizar todos os usuários
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem atualizar todas as assinaturas
CREATE POLICY "Admins can update all subscriptions" ON subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem gerenciar parceiros
CREATE POLICY "Admins can manage partners" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem gerenciar benefícios
CREATE POLICY "Admins can manage benefits" ON benefits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem ver todo o uso de benefícios
CREATE POLICY "Admins can view all benefit usage" ON benefit_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Admins podem ver todos os pagamentos
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.is_admin = true
        )
    );

-- Criar índice para performance
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;