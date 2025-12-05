-- Script para limpar notificações duplicadas
-- Este script mantém apenas a notificação mais recente de cada tipo para cada evento/usuário

-- Primeiro, vamos ver quantas notificações duplicadas existem
SELECT 
    user_id, 
    event_id, 
    type, 
    COUNT(*) as total,
    STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as notification_ids
FROM notificacoes 
WHERE read = FALSE
GROUP BY user_id, event_id, type
HAVING COUNT(*) > 1;

-- Deletar notificações duplicadas, mantendo apenas a mais recente
DELETE FROM notificacoes
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, event_id, type 
                ORDER BY created_at DESC
            ) as rn
        FROM notificacoes
        WHERE read = FALSE
    ) t
    WHERE rn > 1
);

-- Verificar o resultado
SELECT 
    user_id, 
    event_id, 
    type, 
    message,
    created_at,
    read
FROM notificacoes 
ORDER BY created_at DESC;
