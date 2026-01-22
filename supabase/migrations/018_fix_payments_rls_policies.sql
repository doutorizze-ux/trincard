-- Corrigir políticas RLS da tabela payments
-- Remove políticas conflitantes e cria novas políticas corretas

-- Remover todas as políticas existentes da tabela payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own payments or admin can view all" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Criar políticas RLS corretas para a tabela payments
-- Política para visualização: usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_admin_user()
    );

-- Política para inserção: usuários podem inserir seus próprios pagamentos
CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Política para atualização: usuários podem atualizar seus próprios pagamentos
CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        is_admin_user()
    );

-- Garantir que as permissões estão corretas
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- Comentário: Esta migração corrige o problema de RLS na tabela payments
-- removendo políticas conflitantes e criando novas políticas que permitem
-- aos usuários inserir, visualizar e atualizar seus próprios pagamentos