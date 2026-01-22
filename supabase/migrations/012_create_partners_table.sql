-- Criar tabela de parceiros
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  contract_url TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  document_status VARCHAR(20) DEFAULT 'missing' CHECK (document_status IN ('missing', 'uploaded', 'verified')),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_partners_approval_status ON partners(approval_status);
CREATE INDEX idx_partners_document_status ON partners(document_status);
CREATE INDEX idx_partners_created_at ON partners(created_at);

-- Habilitar RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Política para administradores (acesso total)
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
CREATE TRIGGER trigger_update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Conceder permissões
GRANT ALL PRIVILEGES ON partners TO authenticated;
GRANT SELECT ON partners TO anon;

-- Comentários para documentação
COMMENT ON TABLE partners IS 'Tabela para armazenar informações dos parceiros';
COMMENT ON COLUMN partners.company_name IS 'Nome da empresa parceira';
COMMENT ON COLUMN partners.percentage IS 'Porcentagem de comissão do parceiro (0-100)';
COMMENT ON COLUMN partners.contract_url IS 'URL do contrato armazenado no Supabase Storage';
COMMENT ON COLUMN partners.approval_status IS 'Status de aprovação: pending, approved, rejected';
COMMENT ON COLUMN partners.document_status IS 'Status do documento: missing, uploaded, verified';