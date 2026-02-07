
import pool from '../config/db.js';

export const initDb = async () => {
    try {
        console.log('Verificando integridade do banco de dados...');

        // Tabela de Parceiros
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.partners (
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
              created_by uuid,
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now(),
              CONSTRAINT partners_pkey PRIMARY KEY (id),
              CONSTRAINT partners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
            );
        `);

        // Tabela de Planos
        await pool.query(`
           CREATE TABLE IF NOT EXISTS public.plans (
              id uuid NOT NULL DEFAULT gen_random_uuid(),
              name character varying NOT NULL,
              price numeric NOT NULL,
              description text,
              features jsonb,
              is_active boolean DEFAULT true,
              created_at timestamp with time zone DEFAULT now(),
              CONSTRAINT plans_pkey PRIMARY KEY (id)
            );
        `);

        // Tabela de Assinaturas
        await pool.query(`
           CREATE TABLE IF NOT EXISTS public.subscriptions (
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
        `);

        // Tabela de Benefícios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.benefits (
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
        `);

        // Tabela de Uso de Benefícios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.benefit_usage (
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
        `);

        // Criar tabela payments se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.payments (
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
        `);

        // Garantir indices (opcional, mas bom pra performance)
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
            CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
            CREATE INDEX IF NOT EXISTS idx_benefit_usage_user_id ON public.benefit_usage(user_id);
            CREATE INDEX IF NOT EXISTS idx_benefit_usage_benefit_id ON public.benefit_usage(benefit_id);
        `);

        console.log('Banco de dados verificado. Tabelas garantidas.');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        // Não matar o processo, pois pode ser erro de permissão ou conexão momentânea,
        // e o app pode funcionar parcialmente.
    }
};
