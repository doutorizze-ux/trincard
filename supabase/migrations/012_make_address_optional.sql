-- Tornar colunas address e contact_info opcionais na tabela partners
-- Isso resolve o erro de constraint NOT NULL quando o formulário não fornece esses valores

ALTER TABLE partners 
ALTER COLUMN address DROP NOT NULL;

ALTER TABLE partners 
ALTER COLUMN contact_info DROP NOT NULL;

-- Comentários para documentar as mudanças
COMMENT ON COLUMN partners.address IS 'Endereço do parceiro (opcional)';
COMMENT ON COLUMN partners.contact_info IS 'Informações de contato do parceiro (opcional)';