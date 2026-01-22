-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Planos
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários (estende auth.users do Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address JSONB NOT NULL,
    profile_photo_url TEXT,
    card_type VARCHAR(10) CHECK (card_type IN ('digital', 'physical')) DEFAULT 'digital',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Assinaturas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'cancelled')) DEFAULT 'active',
    barcode VARCHAR(255) UNIQUE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Parceiros
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    address JSONB NOT NULL,
    contact_info JSONB NOT NULL,
    approval_status VARCHAR(30) CHECK (approval_status IN ('approved', 'pending_documentation', 'rejected')) DEFAULT 'pending_documentation',
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Benefícios
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    benefit_type VARCHAR(20) CHECK (benefit_type IN ('percentage', 'fixed_amount', 'free_service')) NOT NULL,
    value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Uso de Benefícios
CREATE TABLE benefit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES benefits(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_applied DECIMAL(10,2),
    location TEXT
);

-- Tabela de Pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'credit_card')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_due_date ON subscriptions(due_date);

CREATE INDEX idx_partners_category ON partners(category);
CREATE INDEX idx_partners_approval_status ON partners(approval_status);
CREATE INDEX idx_partners_created_at ON partners(created_at DESC);

CREATE INDEX idx_benefits_partner_id ON benefits(partner_id);
CREATE INDEX idx_benefits_is_active ON benefits(is_active);

CREATE INDEX idx_benefit_usage_user_id ON benefit_usage(user_id);
CREATE INDEX idx_benefit_usage_used_at ON benefit_usage(used_at DESC);

CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Inserir dados iniciais dos planos
INSERT INTO plans (name, price, description, features) VALUES
('TrinCard Básico', 29.90, 'Plano básico com benefícios essenciais', '{"max_benefits": 10, "physical_card": false}'),
('TrinCard Premium', 49.90, 'Plano premium com todos os benefícios', '{"max_benefits": -1, "physical_card": true, "priority_support": true}');

-- Configurar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas RLS para assinaturas
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas RLS para uso de benefícios
CREATE POLICY "Users can view own benefit usage" ON benefit_usage
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own benefit usage" ON benefit_usage
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas RLS para pagamentos
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT user_id::text FROM subscriptions WHERE id = subscription_id
        )
    );

-- Políticas públicas para leitura
CREATE POLICY "Plans are publicly readable" ON plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Approved partners are publicly readable" ON partners
    FOR SELECT USING (approval_status = 'approved');

CREATE POLICY "Active benefits are publicly readable" ON benefits
    FOR SELECT USING (is_active = true);

-- Permissões para roles
GRANT SELECT ON plans TO anon;
GRANT SELECT ON partners TO anon;
GRANT SELECT ON benefits TO anon;

GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON benefit_usage TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON partners TO authenticated;
GRANT ALL PRIVILEGES ON benefits TO authenticated;
GRANT ALL PRIVILEGES ON plans TO authenticated;