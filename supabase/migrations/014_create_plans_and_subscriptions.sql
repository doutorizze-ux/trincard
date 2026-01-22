-- Criar tabela de planos
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de assinaturas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled')) DEFAULT 'active',
    barcode VARCHAR(255) UNIQUE NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de benefícios
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    benefit_type VARCHAR(20) CHECK (benefit_type IN ('percentage', 'fixed_amount', 'free_service')) NOT NULL,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de uso de benefícios
CREATE TABLE benefit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES benefits(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_applied DECIMAL(10,2),
    location TEXT
);

-- Criar tabela de pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'credit_card', 'debit_card')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_due_date ON subscriptions(due_date);
CREATE INDEX idx_benefits_partner_id ON benefits(partner_id);
CREATE INDEX idx_benefits_is_active ON benefits(is_active);
CREATE INDEX idx_benefit_usage_user_id ON benefit_usage(user_id);
CREATE INDEX idx_benefit_usage_used_at ON benefit_usage(used_at DESC);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Inserir planos iniciais
INSERT INTO plans (name, price, description, features) VALUES
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
 }'),
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
 }'),
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
 }');

-- Inserir alguns benefícios de exemplo
INSERT INTO benefits (partner_id, title, description, benefit_type, discount_percentage, is_active)
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
LIMIT 10;

-- Permissões Supabase
GRANT SELECT ON plans TO anon;
GRANT ALL PRIVILEGES ON plans TO authenticated;

GRANT SELECT ON subscriptions TO anon;
GRANT ALL PRIVILEGES ON subscriptions TO authenticated;

GRANT SELECT ON benefits TO anon;
GRANT ALL PRIVILEGES ON benefits TO authenticated;

GRANT SELECT ON benefit_usage TO anon;
GRANT ALL PRIVILEGES ON benefit_usage TO authenticated;

GRANT SELECT ON payments TO anon;
GRANT ALL PRIVILEGES ON payments TO authenticated;

-- RLS Policies para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies para benefit_usage
ALTER TABLE benefit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own benefit usage" ON benefit_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own benefit usage" ON benefit_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plans e benefits são públicos (somente leitura para anon)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);

ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benefits are viewable by everyone" ON benefits FOR SELECT USING (true);