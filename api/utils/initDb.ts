
import pool from '../config/db.js';

export const initDb = async () => {
    try {
        console.log('Verificando integridade do banco de dados...');

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
