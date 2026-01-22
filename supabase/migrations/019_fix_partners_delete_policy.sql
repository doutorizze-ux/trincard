-- Adicionar política RLS para permitir DELETE na tabela partners
-- Permitir que usuários autenticados possam deletar parceiros

CREATE POLICY "Allow authenticated users to delete partners" ON "public"."partners"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Verificar se a política foi criada
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'partners' AND cmd = 'DELETE';