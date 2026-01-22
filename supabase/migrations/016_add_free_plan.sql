-- Adicionar plano Free para testes (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Free') THEN
    INSERT INTO plans (
      name,
      description,
      price,
      features,
      is_active
    ) VALUES (
      'Free',
      'Plano gratuito para testar as funcionalidades básicas',
      0.00,
      '{
        "qr_limit": 10,
        "billing_period": "monthly",
        "benefits": [
          "Até 10 QR codes por mês",
          "Suporte básico por email",
          "Acesso ao dashboard",
          "Relatórios básicos"
        ]
      }'::jsonb,
      true
    );
  END IF;
END $$;