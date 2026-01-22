-- Função para tornar o usuário admin@trincard.com.br um administrador
-- Esta função será executada após o usuário ser criado
CREATE OR REPLACE FUNCTION set_admin_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o email for admin@trincard.com.br, tornar administrador
    IF NEW.email = 'admin@trincard.com.br' THEN
        NEW.is_admin = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função automaticamente
CREATE TRIGGER trigger_set_admin_user
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_admin_user();

-- Caso o usuário admin@trincard.com.br já exista, atualizá-lo
UPDATE users SET is_admin = true WHERE email = 'admin@trincard.com.br';

-- Comentário: O trigger garantirá que qualquer novo usuário com email admin@trincard.com.br
-- será automaticamente definido como administrador durante a criação da conta