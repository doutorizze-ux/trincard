-- Políticas de RLS para a tabela plans
-- Permitir que administradores gerenciem planos

-- Já existe uma política de SELECT para todos
-- Lembre-se que checks de is_admin dependem da tabela users

-- Habilitar RLS se não estiver (já deve estar, mas por segurança)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Política para INSERT (apenas admins)
CREATE POLICY "Admins can insert plans" ON plans
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Política para UPDATE (apenas admins)
CREATE POLICY "Admins can update plans" ON plans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Política para DELETE (apenas admins)
CREATE POLICY "Admins can delete plans" ON plans
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );
