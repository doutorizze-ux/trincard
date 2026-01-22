-- Tornar a coluna 'category' opcional na tabela partners
-- Isso resolve o erro de constraint NOT NULL

ALTER TABLE partners 
ALTER COLUMN category DROP NOT NULL;

-- Adicionar um valor padrão para novos registros
ALTER TABLE partners 
ALTER COLUMN category SET DEFAULT 'geral';

-- Atualizar registros existentes que possam ter category NULL
UPDATE partners 
SET category = 'geral' 
WHERE category IS NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN partners.category IS 'Categoria do parceiro (opcional, padrão: geral)';