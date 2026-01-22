-- Teste específico para operação DELETE na tabela partners

-- 1. Primeiro, vamos criar um parceiro de teste para deletar
INSERT INTO partners (
    company_name,
    category,
    approval_status,
    contact_email,
    contact_phone,
    percentage,
    document_status
) VALUES (
    'Empresa Teste DELETE',
    'teste',
    'pending_documentation',
    'teste@delete.com',
    '(11) 99999-9999',
    10.0,
    'missing'
);

-- 2. Verificar se o parceiro foi criado
SELECT 
    id,
    company_name,
    'Parceiro criado para teste' as status
FROM partners 
WHERE company_name = 'Empresa Teste DELETE';

-- 3. Tentar deletar o parceiro de teste
-- (Vamos usar uma variável para capturar o ID)
DO $$
DECLARE
    test_partner_id uuid;
BEGIN
    -- Buscar o ID do parceiro de teste
    SELECT id INTO test_partner_id 
    FROM partners 
    WHERE company_name = 'Empresa Teste DELETE' 
    LIMIT 1;
    
    -- Se encontrou o parceiro, tentar deletar
    IF test_partner_id IS NOT NULL THEN
        RAISE NOTICE 'Tentando deletar parceiro com ID: %', test_partner_id;
        
        -- Tentar a operação DELETE
        DELETE FROM partners WHERE id = test_partner_id;
        
        -- Verificar se foi deletado
        IF NOT FOUND THEN
            RAISE NOTICE 'ERRO: Parceiro não foi deletado - comando DELETE não afetou nenhuma linha';
        ELSE
            RAISE NOTICE 'SUCESSO: Parceiro deletado com sucesso';
        END IF;
    ELSE
        RAISE NOTICE 'ERRO: Parceiro de teste não foi encontrado';
    END IF;
END $$;

-- 4. Verificar se o parceiro ainda existe após a tentativa de deleção
SELECT 
    COUNT(*) as parceiros_teste_restantes,
    'Parceiros de teste que ainda existem após DELETE' as status
FROM partners 
WHERE company_name = 'Empresa Teste DELETE';