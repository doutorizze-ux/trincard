-- Modificações para rodar Standalone (Sem Supabase Auth)
-- 1. Removemos referências a auth.users
-- 2. Adicionamos password_hash na tabela users
-- 3. Adicionamos role na tabela users para controle de permissão

-- Tabela de Usuários (Modificada)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL, -- ADICIONADO: Senha criptografada
  full_name character varying NOT NULL,
  cpf character varying NOT NULL UNIQUE,
  phone character varying NOT NULL,
  address jsonb NOT NULL,
  profile_photo_url text,
  card_type character varying DEFAULT 'digital'::character varying CHECK (card_type::text = ANY (ARRAY['digital'::character varying, 'physical'::character varying]::text[])),
  is_active boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  role character varying DEFAULT 'user', -- ADICIONADO: Role simples
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Tabela de Parceiros (Modificada Foreign Key)
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name character varying NOT NULL,
  category character varying DEFAULT 'geral'::character varying,
  address jsonb,
  contact_info jsonb,
  approval_status character varying DEFAULT 'pending_documentation'::character varying CHECK (approval_status::text = ANY (ARRAY['approved'::character varying, 'pending_documentation'::character varying, 'rejected'::character varying]::text[])),
  approval_date timestamp with time zone,
  percentage numeric CHECK (percentage >= 0::numeric AND percentage <= 100::numeric),
  contract_url text,
  document_status character varying DEFAULT 'missing'::character varying CHECK (document_status::text = ANY (ARRAY['missing'::character varying, 'uploaded'::character varying, 'verified'::character varying]::text[])),
  contact_email character varying,
  contact_phone character varying,
  notes text,
  created_by uuid, -- FK aponta para public.users agora
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partners_pkey PRIMARY KEY (id),
  CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Tabela de Benefícios (Original)
CREATE TABLE public.benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid,
  description text NOT NULL,
  benefit_type character varying NOT NULL CHECK (benefit_type::text = ANY (ARRAY['percentage'::character varying, 'fixed_amount'::character varying, 'free_service'::character varying]::text[])),
  value numeric,
  title character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT benefits_pkey PRIMARY KEY (id),
  CONSTRAINT benefits_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);

-- Tabela de Uso de Benefícios (Original)
CREATE TABLE public.benefit_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  benefit_id uuid,
  used_at timestamp with time zone DEFAULT now(),
  discount_applied numeric,
  location text,
  CONSTRAINT benefit_usage_pkey PRIMARY KEY (id),
  CONSTRAINT benefit_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT benefit_usage_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.benefits(id)
);

-- Tabela de Planos (Original)
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  price numeric NOT NULL,
  description text,
  features jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);

-- Tabela de Assinaturas (Original)
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  plan_id uuid,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'cancelled'::character varying]::text[])),
  barcode character varying NOT NULL UNIQUE,
  due_date timestamp with time zone NOT NULL,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);

-- Tabela de Pagamentos (Original)
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_id uuid,
  amount numeric NOT NULL,
  payment_method character varying NOT NULL CHECK (payment_method::text = ANY (ARRAY['pix'::character varying, 'credit_card'::character varying, 'debit_card'::character varying]::text[])),
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  transaction_id character varying,
  paid_at timestamp with time zone,
  user_id uuid,
  payment_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
