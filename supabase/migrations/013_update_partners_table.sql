-- Adicionar campos necessários à tabela partners existente

-- Adicionar campo percentage se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'percentage') THEN
        ALTER TABLE partners ADD COLUMN percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100);
    END IF;
END $$;

-- Adicionar campo contract_url se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'contract_url') THEN
        ALTER TABLE partners ADD COLUMN contract_url TEXT;
    END IF;
END $$;

-- Adicionar campo document_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'document_status') THEN
        ALTER TABLE partners ADD COLUMN document_status VARCHAR(20) DEFAULT 'missing' 
        CHECK (document_status IN ('missing', 'uploaded', 'verified'));
    END IF;
END $$;

-- Adicionar campo contact_email se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'contact_email') THEN
        ALTER TABLE partners ADD COLUMN contact_email VARCHAR(255);
    END IF;
END $$;

-- Adicionar campo contact_phone se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'contact_phone') THEN
        ALTER TABLE partners ADD COLUMN contact_phone VARCHAR(20);
    END IF;
END $$;

-- Adicionar campo notes se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'notes') THEN
        ALTER TABLE partners ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Adicionar campo created_by se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'partners' AND column_name = 'created_by') THEN
        ALTER TABLE partners ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_partners_percentage ON partners(percentage);
CREATE INDEX IF NOT EXISTS idx_partners_document_status ON partners(document_status);
CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON partners(contact_email);

-- Atualizar políticas RLS para administradores
DROP POLICY IF EXISTS "Admins can manage all partners" ON partners;
CREATE POLICY "Admins can manage all partners" ON partners
  FOR ALL
  TO authenticated
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

-- Política para usuários autenticados (apenas leitura de parceiros aprovados)
DROP POLICY IF EXISTS "Authenticated users can view approved partners" ON partners;
CREATE POLICY "Authenticated users can view approved partners" ON partners
  FOR SELECT
  TO authenticated
  USING (approval_status = 'approved');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_partners_updated_at ON partners;
CREATE TRIGGER trigger_update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Comentários para documentação dos novos campos
COMMENT ON COLUMN partners.percentage IS 'Porcentagem de comissão do parceiro (0-100)';
COMMENT ON COLUMN partners.contract_url IS 'URL do contrato armazenado no Supabase Storage';
COMMENT ON COLUMN partners.document_status IS 'Status do documento: missing, uploaded, verified';
COMMENT ON COLUMN partners.contact_email IS 'Email de contato do parceiro';
COMMENT ON COLUMN partners.contact_phone IS 'Telefone de contato do parceiro';
COMMENT ON COLUMN partners.notes IS 'Observações sobre o parceiro';
COMMENT ON COLUMN partners.created_by IS 'ID do usuário que criou o registro';