-- Script de Configuração do Banco de Dados - Agenda Compartilhada
-- Execute este script no PostgreSQL para criar o banco e as tabelas

-- Criar banco de dados (execute como superuser)
-- CREATE DATABASE agenda_db;

-- Conectar ao banco agenda_db antes de executar os comandos abaixo
-- \c agenda_db

-- =======================
-- TABELA DE USUÁRIOS
-- =======================
DROP TABLE IF EXISTS participations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL, -- Email do usuário
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance de busca por username
CREATE INDEX idx_users_username ON users(username);

-- =======================
-- TABELA DE EVENTOS
-- =======================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Chave estrangeira para garantir que o organizador exista
    CONSTRAINT fk_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_end_time ON events(end_time);

-- =======================
-- TABELA DE PARTICIPAÇÕES
-- =======================
CREATE TABLE participations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
    
    -- Chave estrangeira para o evento
    CONSTRAINT fk_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE,
    
    -- Chave estrangeira para o usuário
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    
    -- Garante que um usuário só possa ter uma participação por evento
    UNIQUE (event_id, user_id)
);

-- Índices para melhorar performance
CREATE INDEX idx_participations_event ON participations(event_id);
CREATE INDEX idx_participations_user ON participations(user_id);
CREATE INDEX idx_participations_status ON participations(status);

-- =======================
-- DADOS DE TESTE (OPCIONAL)
-- =======================
-- Descomente as linhas abaixo se quiser criar usuários de teste

-- Usuário teste 1: teste1@email.com / senha: 123456
-- INSERT INTO users (username, password_hash) 
-- VALUES ('teste1@email.com', '$2b$10$YourHashedPasswordHere');

-- Usuário teste 2: teste2@email.com / senha: 123456
-- INSERT INTO users (username, password_hash) 
-- VALUES ('teste2@email.com', '$2b$10$YourHashedPasswordHere');

-- Verificar criação das tabelas
SELECT 'Tabela users criada com sucesso!' as status, COUNT(*) as total_users FROM users;
SELECT 'Tabela events criada com sucesso!' as status, COUNT(*) as total_events FROM events;
SELECT 'Tabela participations criada com sucesso!' as status, COUNT(*) as total_participations FROM participations;

-- =======================
-- QUERIES ÚTEIS
-- =======================

-- Ver todos os eventos com informações do organizador
-- SELECT e.*, u.username as organizer_email 
-- FROM events e 
-- JOIN users u ON e.organizer_id = u.id;

-- Ver todas as participações com informações completas
-- SELECT 
--     p.id, 
--     p.status,
--     e.title as event_title,
--     e.start_time,
--     u.username as participant_email
-- FROM participations p
-- JOIN events e ON p.event_id = e.id
-- JOIN users u ON p.user_id = u.id;

-- Listar convites pendentes de um usuário específico (substitua USER_ID)
-- SELECT e.*, p.id as participation_id
-- FROM events e
-- JOIN participations p ON e.id = p.event_id
-- WHERE p.user_id = USER_ID AND p.status = 'invited';

-- Listar eventos aceitos de um usuário específico (substitua USER_ID)
-- SELECT e.*, p.id as participation_id
-- FROM events e
-- JOIN participations p ON e.id = p.event_id
-- WHERE p.user_id = USER_ID AND p.status = 'accepted';

COMMIT;

