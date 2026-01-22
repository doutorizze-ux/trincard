-- MIGRATION COMPLETA TRINCARD
-- Parte 1: Limpeza e Criação de Tabelas
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.benefit_usage CASCADE;
DROP TABLE IF EXISTS public.benefits CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Tabelas
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL, -- Senha criptografada
  full_name character varying NOT NULL,
  cpf character varying NOT NULL UNIQUE,
  phone character varying NOT NULL,
  address jsonb DEFAULT '{}',
  profile_photo_url text,
  card_type character varying DEFAULT 'digital',
  is_active boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  role character varying DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

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

CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name character varying NOT NULL,
  category character varying DEFAULT 'geral',
  address jsonb,
  contact_info jsonb,
  approval_status character varying DEFAULT 'pending_documentation',
  approval_date timestamp with time zone,
  percentage numeric,
  contract_url text,
  document_status character varying DEFAULT 'missing',
  contact_email character varying,
  contact_phone character varying,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partners_pkey PRIMARY KEY (id),
  CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE public.benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid,
  description text NOT NULL,
  benefit_type character varying NOT NULL,
  value numeric,
  title character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT benefits_pkey PRIMARY KEY (id),
  CONSTRAINT benefits_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id)
);

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  plan_id uuid,
  status character varying DEFAULT 'active',
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

-- Parte 2: Inserir Usuário Admin Padrão
-- ID fixo para bater com os inserts dos parceiros
-- Senha padrão (hash de 'admin123') - VOCÊ DEVE MUDAR DEPOIS
INSERT INTO public.users (id, email, password_hash, full_name, cpf, phone, is_admin, role)
VALUES (
  '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a', 
  'admin@trincard.com', 
  '$2b$10$X7.p... (hash placeholder)', 
  'Administrador TrinCard', 
  '000.000.000-00', 
  '00000000000', 
  true, 
  'admin'
);

-- Parte 3: Inserir Parceiros (Do seu arquivo partners_rows.sql)
INSERT INTO "public"."partners" ("id", "company_name", "category", "address", "contact_info", "approval_status", "approval_date", "created_at", "updated_at", "percentage", "contract_url", "document_status", "contact_email", "contact_phone", "notes", "created_by") VALUES 
('0ca2b233-c87d-4d45-aafb-98375b2e7b24', 'valissi ', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:44:03.614519+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('0f11c562-331e-4a96-ad96-9b99030d9f6b', 'drogaria neto', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:37:12.903092+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('20762884-ee00-4f14-9496-c82e43267d4e', 'DROGARIA AVILA', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:52:33.303647+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62305 0288', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('21b0c980-b037-4e21-80c6-616988e30f2f', 'drogaria nossa senhora de fatima 2', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:37:47.452447+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('282aba1e-14c3-472f-b13f-dfaef604ab4b', 'drogaria do beco', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:36:52.719119+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62984136376', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('2a46a5c8-b392-4919-a13e-c64d5c48061f', 'BRUTTIE CASA DE PÃES', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 14:01:07.299769+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', 'BRUTTEPAES@GMAIL.COM', '62 995655984', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('2dfba787-41c9-4ea0-b1af-ddaf1e9d42cc', 'drogaria farmaplus ', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:32:03.622268+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '35050532', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('3e07e339-5a22-4bba-a878-e91359079dac', 'ALICE BOLINHOS E PAMONHAS - ELISA', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:44:46.610614+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62 999392155', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('4212424a-d46e-4b0f-9b3b-e05547930ed0', 'Drogaria big popular', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:49:07.425086+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '6235061147', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('4863f10f-1da8-4e7c-8eb8-0f17636cd4cd', 'supermecado granja  beto', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:30:10.207591+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('53c9e314-3677-4749-908e-55d9eb37f803', 'PADARIA ADORE', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:55:57.245149+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('5979a1b6-b816-4525-8637-324316d33577', 'drogasil', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:48:15.419437+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('6ce7bac4-f2e3-4393-afae-9e70d53dfbd7', 'super store vila pai eterno', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:27:33.867967+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('6d14efa3-affe-432b-9963-93a6c261998f', 'drogavi Eduardo', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:35:26.772755+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '64992621621', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('86494cc0-4ff0-46a2-9e22-919047cdcf5a', 'PIT DOG ALAN', 'Alimentação', '{"city": "São Paulo", "state": "SP", "street": "Endereço não informado", "zip_code": "00000-000"}', null, 'approved', '2025-08-27 19:19:05.984+00', '2025-08-22 14:54:09.293344+00', '2025-12-25 22:30:52.30406+00', '0.00', '', 'missing', '', '62 984945316', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('8928fbcf-5bc5-4f69-aaf6-c69a690f21be', 'cristal supermecado guarula park', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:26:09.123478+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('8e9d5286-2d87-48f2-a7da-5fa3a2d583bd', 'LIGFARMA TRINDADE', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:53:41.156598+00', '2025-12-25 22:58:58.392291+00', '10.00', '', 'missing', '', '6235050055', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('8fbf2bb4-d5eb-4951-9094-345db01120b2', 'drogaria vita', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:51:22.143566+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '6235052471', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('932062e8-56da-4b56-96d5-885c5d11c3de', 'Alice Bolinhos e Pamonhas', 'Alimentação', '{"city": "São Paulo", "state": "SP", "street": "Endereço não informado", "zip_code": "00000-000"}', null, 'approved', null, '2025-10-07 21:27:10.708062+00', '2025-12-25 22:30:52.30406+00', '10.00', '', 'missing', '', '62999392155', 'Produtos de milho em geral.', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('985c531e-e8b7-46bc-bbe7-64fda28ba797', 'AGENCIA PREMIUS VIAGENS - ELEUZA', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:42:07.411303+00', '2025-12-25 22:58:58.392291+00', '5.00', '', 'missing', 'agenciapremius14@gmail.com', '62985748806', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('9954c2fb-9288-43f5-bd08-3a710e768bf8', 'PADARIA JUNBO', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:56:41.11864+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('a03249af-5430-4c84-a41a-279379eff055', 'OTICAS RENASCER-LUIZ UMBERTO', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:43:33.802253+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62 9991248909', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('a76238cc-035b-4c8f-86cf-e2e36d0d6d85', 'supermecado freitas setor oeste', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:26:46.642645+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('b96d5e36-08f7-43df-b459-058237314175', 'supermecado barão', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:28:05.975289+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('c7177276-fcd1-4111-b843-f96f2429cbcc', 'DROGARIA BIG POPULAR', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:41:30.86666+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62 999715248', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('c732142b-dbc4-4ef7-a01f-8ad4bf6a39c4', 'DONA MOÇA', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 14:03:05.816453+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62 984293967', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('d3606e75-b82b-40c2-ac43-093ce97ca1e9', 'BLEZZ CLINICA E ESTETICA -THALIA', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:45:56.682572+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '62 984512005', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('e200559b-7c28-430d-84ec-0b431d08c3f2', 'supermecado aliança vila emanoel', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-27 19:31:03.71502+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a'), 
('efa4e596-9580-459c-8776-d2ebe4398ab9', 'LANCHONETE  EDINHO E JUCY', 'geral', null, null, 'approved', '2025-12-25 22:58:58.392291+00', '2025-08-22 13:57:50.446961+00', '2025-12-25 22:58:58.392291+00', '0.00', '', 'missing', '', '', '', '1f5eed07-e4aa-4b8b-800c-aa1a69702c4a');
