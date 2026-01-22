-- Verificar se os planos já existem e inserir apenas os que estão faltando
INSERT INTO plans (name, price, description, features) 
SELECT * FROM (
  VALUES 
    ('TrinCard Básico', 29.90, 'Plano básico com benefícios essenciais para iniciantes no mundo fitness', 
     '{
       "max_benefits": 10,
       "physical_card": false,
       "priority_support": false,
       "exclusive_benefits": false,
       "features": [
         "Cartão digital",
         "Acesso a parceiros básicos",
         "Suporte por e-mail",
         "Até 10 benefícios por mês"
       ]
     }'::jsonb),
    ('TrinCard Premium', 49.90, 'Plano premium com todos os benefícios e cartão físico incluído', 
     '{
       "max_benefits": -1,
       "physical_card": true,
       "priority_support": true,
       "exclusive_benefits": false,
       "features": [
         "Cartão digital e físico",
         "Acesso a todos os parceiros",
         "Suporte 24/7",
         "Benefícios ilimitados",
         "Atendimento prioritário"
       ]
     }'::jsonb),
    ('TrinCard VIP', 89.90, 'Plano VIP com benefícios exclusivos e atendimento personalizado', 
     '{
       "max_benefits": -1,
       "physical_card": true,
       "priority_support": true,
       "exclusive_benefits": true,
       "features": [
         "Cartão digital e físico premium",
         "Acesso a todos os parceiros",
         "Suporte VIP 24/7",
         "Benefícios ilimitados",
         "Benefícios exclusivos VIP",
         "Atendimento personalizado",
         "Descontos especiais"
       ]
     }'::jsonb)
) AS new_plans(name, price, description, features)
WHERE NOT EXISTS (
  SELECT 1 FROM plans WHERE plans.name = new_plans.name
);

-- Adicionar campo title na tabela benefits se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'benefits' AND column_name = 'title') THEN
        ALTER TABLE benefits ADD COLUMN title VARCHAR(255);
    END IF;
END $$;

-- Atualizar benefits existentes para ter título se não tiverem
UPDATE benefits 
SET title = CASE 
    WHEN description LIKE '%academia%' OR description LIKE '%Mensalidade%' THEN 'Desconto na Mensalidade'
    WHEN description LIKE '%farmacia%' OR description LIKE '%Medicamentos%' THEN 'Desconto em Medicamentos'
    WHEN description LIKE '%hospital%' OR description LIKE '%Consultas%' THEN 'Desconto em Consultas'
    ELSE 'Desconto Geral'
END
WHERE title IS NULL;

-- Inserir alguns benefícios de exemplo se não existirem
INSERT INTO benefits (partner_id, title, description, benefit_type, value, is_active)
SELECT 
    p.id,
    CASE 
        WHEN p.category = 'academia' THEN 'Desconto na Mensalidade'
        WHEN p.category = 'farmacia' THEN 'Desconto em Medicamentos'
        WHEN p.category = 'hospital' THEN 'Desconto em Consultas'
        ELSE 'Desconto Geral'
    END,
    CASE 
        WHEN p.category = 'academia' THEN 'Desconto especial na mensalidade para portadores do TrinCard'
        WHEN p.category = 'farmacia' THEN 'Desconto em medicamentos e suplementos'
        WHEN p.category = 'hospital' THEN 'Desconto em consultas e exames'
        ELSE 'Desconto especial para portadores do TrinCard'
    END,
    'percentage',
    CASE 
        WHEN p.category = 'academia' THEN 20.00
        WHEN p.category = 'farmacia' THEN 15.00
        WHEN p.category = 'hospital' THEN 25.00
        ELSE 10.00
    END,
    true
FROM partners p
WHERE p.approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM benefits b WHERE b.partner_id = p.id
  )
LIMIT 10;

-- Adicionar campos faltantes na tabela subscriptions se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'start_date') THEN
        ALTER TABLE subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'end_date') THEN
        ALTER TABLE subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Adicionar campos faltantes na tabela payments se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'user_id') THEN
        ALTER TABLE payments ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
        ALTER TABLE payments ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Atualizar constraint do payment_method para incluir debit_card
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
    CHECK (payment_method IN ('pix', 'credit_card', 'debit_card'));

-- Atualizar constraint do status para incluir completed
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));