-- Script para adicionar a coluna is_public à tabela eventos
-- Execute este script no seu banco de dados PostgreSQL no Render

-- Adiciona a coluna is_public (booleano, padrão TRUE para eventos públicos)
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Atualiza eventos existentes para serem públicos por padrão
UPDATE eventos SET is_public = TRUE WHERE is_public IS NULL;

-- Confirma a alteração
SELECT 'Coluna is_public adicionada com sucesso!' AS status;

