-- Verificar e corrigir o status de administrador para admin@trincard.com.br
-- Esta migração garante que o usuário admin seja definido como administrador

-- Primeiro, verificar se o usuário existe e atualizar is_admin para true
UPDATE users 
SET is_admin = true, updated_at = NOW()
WHERE email = 'admin@trincard.com.br';

-- Verificar se a atualização foi bem-sucedida
-- Se o usuário não existir, esta query não afetará nenhuma linha
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@trincard.com.br' AND is_admin = true) THEN
        RAISE NOTICE 'ATENÇÃO: Usuário admin@trincard.com.br não encontrado ou não foi definido como administrador.';
        RAISE NOTICE 'Certifique-se de que a conta foi criada primeiro.';
    ELSE
        RAISE NOTICE 'Usuário admin@trincard.com.br definido como administrador com sucesso!';
    END IF;
END $$;

-- Garantir que o trigger está funcionando para futuras criações
-- Recriar o trigger se necessário
DROP TRIGGER IF EXISTS trigger_set_admin_user ON users;

CREATE TRIGGER trigger_set_admin_user
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_admin_user();

-- Comentário: Esta migração força a definição do usuário admin como administrador
-- e garante que o trigger está ativo para futuras criações de conta