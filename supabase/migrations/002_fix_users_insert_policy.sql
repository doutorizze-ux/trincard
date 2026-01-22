-- Adicionar política de INSERT para permitir criação de novos usuários
CREATE POLICY "Users can insert own profile during registration" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Adicionar política de INSERT para usuários anônimos (durante o registro)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Remover a política anterior mais restritiva se existir
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON users;

-- Criar política final que permite inserção durante o registro
CREATE POLICY "Enable user registration" ON users
    FOR INSERT WITH CHECK (true);