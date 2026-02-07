
import pool from '../api/config/db';

async function migrate() {
    try {
        console.log('Verificando e criando tabela payments...');

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

        console.log('Tabela payments criada (ou já existia)!');
        process.exit(0);
    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
