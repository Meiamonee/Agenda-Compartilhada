const express = require("express");
const pool = require("./Banco/db");
const cors = require('cors');
const axios = require("axios");
const Opossum = require("opossum");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const servico1Url = process.env.SERVICO1_URL;
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

// =================================
// Tópico 8: Tolerância a Falhas/Resiliência (Circuit Breaker)
// =================================

// 1. Função base para chamada do Serviço 1 (Usuários)
async function callUserService(endpoint, token) {
    if (!servico1Url) {
        throw new Error("SERVICO1_URL não configurada.");
    }
    const response = await axios.get(`${servico1Url}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

// 2. Configuração do Circuit Breaker (Disjuntor)
const options = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
};

const circuit = new Opossum(callUserService, options);
circuit.on('open', () => console.warn('🛑 CIRCUIT BREAKER ABERTO: Serviço de Usuários está indisponível.'));
circuit.on('close', () => console.log('✅ CIRCUIT BREAKER FECHADO: Serviço de Usuários se recuperou.'));

// =================================
// Middleware de Autorização (AGORA LÊ empresaId)
// =================================
const authorize = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Autorização requer token JWT." });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.token = token;
        req.empresaId = decoded.empresaId; // 👈 Lendo o ID da empresa do token
        req.isOwner = decoded.isOwner;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido ou expirado." });
    }
};

// =================================
// Funções de Coordenação com Circuit Breaker
// =================================
async function getUserDetails(userId, token) {
    try {
        // Usa o Circuit Breaker
        return await circuit.fire(`/usuarios/${userId}`, token);
    } catch (err) {
        if (err.name === 'CircuitBreakerOpenError') {
            const serviceUnavailable = new Error("Serviço de Usuários temporariamente indisponível (Circuit Breaker Aberto).");
            serviceUnavailable.status = 503;
            throw serviceUnavailable;
        }

        if (err.status === 404 || (err.response && err.response.status === 404)) {
            const notFound = new Error(`Usuário ${userId} não encontrado.`);
            notFound.status = 404;
            throw notFound;
        }

        const internalError = new Error("Erro de comunicação com o Serviço de Usuários.");
        internalError.status = 500;
        throw internalError;
    }
}


// ===============================================
// 1. Rota POST /eventos (Criação de Evento)
// ===============================================
app.post("/eventos", authorize, async (req, res) => {
    const { title, description, start_time, end_time, organizer_id, is_public } = req.body;

    if (req.userId !== organizer_id) {
        return res.status(403).json({ error: "A criação de evento deve ser feita com o ID do usuário logado." });
    }

    if (!title || !start_time || !end_time || !organizer_id) {
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    try {
        await getUserDetails(organizer_id, req.token);

        // 🛑 Adicionando o ID da Empresa para isolamento
        const result = await pool.query(
            "INSERT INTO eventos (title, description, start_time, end_time, organizer_id, is_public, empresa_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [title, description, start_time, end_time, organizer_id, is_public !== false, req.empresaId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        const statusCode = err.status || (err.response ? err.response.status : 500);
        res.status(statusCode).json({ error: err.message || "Erro interno ao criar evento." });
    }
});

// ==================================================================
// 2. Rota POST /eventos/:evento_id/convidar (Envio de Convites)
// ==================================================================
app.post("/eventos/:evento_id/convidar", authorize, async (req, res) => {
    const { evento_id } = req.params;
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ error: "Lista de 'user_ids' para convite é obrigatória." });
    }

    try {
        // Autorização: Verifica se o usuário logado é o organizador e se o evento pertence à empresa
        const eventResult = await pool.query("SELECT organizer_id, empresa_id FROM eventos WHERE id = $1", [evento_id]);
        if (eventResult.rows.length === 0 || eventResult.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }
        if (eventResult.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode convidar pessoas." });
        }

        // Coordenação: Verifica a existência de TODOS os usuários
        // IMPORTANTE: getUserDetails no Servico 1 já garante que o usuário exista NA MESMA EMPRESA
        await Promise.all(user_ids.map(id => getUserDetails(id, req.token)));

        // Insere convites (status='invited')
        const values = user_ids.map((id, index) => `($${index * 2 + 1}, $${index * 2 + 2}, 'invited')`).join(',');
        const params = user_ids.flatMap(id => [evento_id, id]);

        const query = `
            INSERT INTO participacoes (event_id, user_id, status) 
            VALUES ${values} 
            ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'invited' 
            RETURNING *;
        `;

        const result = await pool.query(query, params);

        res.status(201).json({
            message: `${result.rows.length} convite(s) enviado(s) ou atualizado(s) com sucesso.`,
            invites: result.rows
        });

    } catch (err) {
        const statusCode = err.status || (err.response ? err.response.status : 500);
        res.status(statusCode).json({ error: err.message || "Erro interno ao enviar convites." });
    }
});

// ====================================================================
// 3. Rota PUT /participations/:id (Aceitar/Recusar Convite)
// ====================================================================
app.put("/participations/:id", authorize, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: "Status deve ser 'accepted' ou 'declined'." });
    }

    try {
        // Verifica se a participação existe e pertence ao usuário logado
        const participationCheck = await pool.query(
            `SELECT p.*, e.empresa_id 
             FROM participacoes p 
             JOIN eventos e ON p.event_id = e.id 
             WHERE p.id = $1`,
            [id]
        );

        if (participationCheck.rows.length === 0) {
            return res.status(404).json({ error: "Participação não encontrada." });
        }

        const participation = participationCheck.rows[0];

        // Verifica se pertence à mesma empresa
        if (participation.empresa_id !== req.empresaId) {
            return res.status(403).json({ error: "Acesso negado." });
        }

        // Verifica se é o próprio usuário
        if (participation.user_id !== req.userId) {
            return res.status(403).json({ error: "Você só pode atualizar suas próprias participações." });
        }

        // Atualiza o status
        const result = await pool.query(
            "UPDATE participacoes SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        res.json({
            message: `Convite ${status === 'accepted' ? 'aceito' : 'recusado'} com sucesso.`,
            participation: result.rows[0]
        });

    } catch (err) {
        console.error("Erro ao atualizar participação:", err);
        res.status(500).json({ error: "Erro interno ao atualizar participação." });
    }
});

// =================================================================
// 4. Rota GET /eventos (Listar Eventos da Empresa)
// =================================================================
app.get("/eventos", authorize, async (req, res) => {
    try {
        // 🛑 Filtra todos os eventos APENAS pela empresa do usuário logado
        const result = await pool.query("SELECT * FROM eventos WHERE empresa_id = $1 ORDER BY start_time ASC", [req.empresaId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao listar eventos." });
    }
});

// ====================================================================
// 7. Rota GET /eventos/:id (Detalhes de um Evento Específico) - ISOLADA
// ====================================================================
app.get("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        // 🛑 Filtra o evento pelo ID e pela empresa do usuário logado
        const result = await pool.query(
            "SELECT * FROM eventos WHERE id = $1 AND empresa_id = $2",
            [id, req.empresaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao buscar evento:", err);
        res.status(500).json({ error: "Erro interno ao buscar evento." });
    }
});

// Helper para criar notificação (com deduplicação)
async function createNotification(userId, message, type, eventId) {
    try {
        // Verifica se já existe uma notificação do mesmo tipo para o mesmo evento
        const existingNotif = await pool.query(
            "SELECT id FROM notificacoes WHERE user_id = $1 AND event_id = $2 AND type = $3",
            [userId, eventId, type]
        );

        if (existingNotif.rows.length > 0) {
            // Atualiza a notificação existente com a nova mensagem e timestamp
            await pool.query(
                "UPDATE notificacoes SET message = $1, created_at = NOW() WHERE id = $2",
                [message, existingNotif.rows[0].id]
            );
        } else {
            // Cria uma nova notificação
            await pool.query(
                "INSERT INTO notificacoes (user_id, message, type, event_id) VALUES ($1, $2, $3, $4)",
                [userId, message, type, eventId]
            );
        }
    } catch (err) {
        console.error("Erro ao criar notificação:", err);
    }
}

// ====================================================================
// 8. Rota PUT /eventos/:id (Atualizar Evento) - ISOLADA
// ====================================================================
app.put("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;
    const { title, description, start_time, end_time, is_public } = req.body;

    try {
        // Autorização: Verifica se o evento existe, pertence à empresa e se o usuário é o organizador
        const eventCheck = await pool.query(
            "SELECT organizer_id, empresa_id FROM eventos WHERE id = $1",
            [id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        if (eventCheck.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode atualizar este evento." });
        }

        // Atualiza apenas os campos fornecidos
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramCount++}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (start_time !== undefined) {
            updates.push(`start_time = $${paramCount++}`);
            values.push(start_time);
        }
        if (end_time !== undefined) {
            updates.push(`end_time = $${paramCount++}`);
            values.push(end_time);
        }
        if (is_public !== undefined) {
            updates.push(`is_public = $${paramCount++}`);
            values.push(is_public);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "Nenhum campo para atualizar foi fornecido." });
        }

        values.push(id);
        const query = `UPDATE eventos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(query, values);

        // Notificar participantes sobre a atualização
        try {
            const participants = await pool.query("SELECT user_id FROM participacoes WHERE event_id = $1", [id]);
            for (const p of participants.rows) {
                if (p.user_id !== req.userId) {
                    await createNotification(p.user_id, `O evento "${result.rows[0].title}" foi atualizado.`, 'update', id);
                }
            }
        } catch (notifErr) {
            console.error("Erro ao criar notificações:", notifErr);
        }

        res.json({ message: "Evento atualizado com sucesso.", evento: result.rows[0] });

    } catch (err) {
        console.error("Erro ao atualizar evento:", err);
        res.status(500).json({ error: "Erro interno ao atualizar evento." });
    }
});

// ====================================================================
// 9. Rota DELETE /eventos/:id (Deletar Evento) - ISOLADA
// ====================================================================
app.delete("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        // Autorização: Verifica se o evento existe, pertence à empresa e se o usuário é o organizador
        const eventCheck = await pool.query(
            "SELECT organizer_id, empresa_id, title FROM eventos WHERE id = $1",
            [id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        if (eventCheck.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode deletar este evento." });
        }

        // Buscar participantes antes de deletar
        const participants = await pool.query("SELECT user_id FROM participacoes WHERE event_id = $1", [id]);
        const eventTitle = eventCheck.rows[0].title;

        // Deleta o evento (CASCADE vai deletar as participações automaticamente)
        await pool.query("DELETE FROM eventos WHERE id = $1", [id]);

        // Notificar participantes sobre cancelamento
        try {
            for (const p of participants.rows) {
                if (p.user_id !== req.userId) {
                    await createNotification(p.user_id, `O evento "${eventTitle}" foi cancelado.`, 'cancel', null);
                }
            }
        } catch (notifErr) {
            console.error("Erro ao criar notificações:", notifErr);
        }

        res.json({ message: "Evento deletado com sucesso." });

    } catch (err) {
        console.error("Erro ao deletar evento:", err);
        res.status(500).json({ error: "Erro interno ao deletar evento." });
    }
});

// ====================================================================
// 10. Rota GET /eventos/:id/participantes (Listar Participantes) - ISOLADA
// ====================================================================
app.get("/eventos/:id/participantes", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o evento existe e pertence à empresa do usuário
        const eventCheck = await pool.query(
            "SELECT id, empresa_id FROM eventos WHERE id = $1",
            [id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        // Lista todos os participantes do evento
        const participantsResult = await pool.query(
            `SELECT 
                p.id AS participation_id,
                p.user_id,
                p.status,
                p.event_id
             FROM participacoes p
             WHERE p.event_id = $1
             ORDER BY p.status, p.id`,
            [id]
        );

        // Busca detalhes dos usuários do Serviço 1
        const participantsWithDetails = await Promise.all(
            participantsResult.rows.map(async (participant) => {
                try {
                    const userDetails = await getUserDetails(participant.user_id, req.token);
                    return {
                        ...participant,
                        user_email: userDetails.email
                    };
                } catch (err) {
                    // Se não conseguir buscar detalhes, retorna sem email
                    return {
                        ...participant,
                        user_email: "Usuário não encontrado"
                    };
                }
            })
        );

        res.json(participantsWithDetails);

    } catch (err) {
        console.error("Erro ao listar participantes:", err);
        res.status(500).json({ error: "Erro interno ao listar participantes." });
    }
});

// ====================================================================
// 11. Rota DELETE /eventos/:evento_id/participantes/:user_id (Remover Participante) - ISOLADA
// ====================================================================
app.delete("/eventos/:evento_id/participantes/:user_id", authorize, async (req, res) => {
    const { evento_id, user_id } = req.params;

    try {
        // Autorização: Verifica se o evento existe, pertence à empresa e se o usuário é o organizador
        const eventCheck = await pool.query(
            "SELECT organizer_id, empresa_id FROM eventos WHERE id = $1",
            [evento_id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        if (eventCheck.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode remover participantes." });
        }

        // Remove a participação
        const result = await pool.query(
            "DELETE FROM participacoes WHERE event_id = $1 AND user_id = $2 RETURNING *",
            [evento_id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Participação não encontrada." });
        }

        res.json({ message: "Participante removido com sucesso." });

    } catch (err) {
        console.error("Erro ao remover participante:", err);
        res.status(500).json({ error: "Erro interno ao remover participante." });
    }
});

// ====================================================================
// 5. Rota GET /usuarios/:user_id/convites (Listar Convites de um Usuário)
// ====================================================================
app.get("/usuarios/:user_id/convites", authorize, async (req, res) => {
    const { user_id } = req.params;

    // Segurança: Usuário só pode ver seus próprios convites (ou dono da empresa)
    if (parseInt(user_id) !== req.userId && !req.isOwner) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    try {
        const result = await pool.query(
            `SELECT p.*, e.title, e.description, e.start_time, e.end_time, e.organizer_id 
             FROM participacoes p
             JOIN eventos e ON p.event_id = e.id
             WHERE p.user_id = $1 AND p.status = 'invited' AND e.empresa_id = $2`,
            [user_id, req.empresaId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar convites:", err);
        res.status(500).json({ error: "Erro interno ao listar convites." });
    }
});

// ====================================================================
// 6. Rota GET /usuarios/:user_id/aceitos (Listar Eventos Aceitos de um Usuário)
// ====================================================================
app.get("/usuarios/:user_id/aceitos", authorize, async (req, res) => {
    const { user_id } = req.params;

    // Segurança: Usuário só pode ver seus próprios eventos (ou dono da empresa)
    if (parseInt(user_id) !== req.userId && !req.isOwner) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    try {
        const result = await pool.query(
            `SELECT p.*, e.title, e.description, e.start_time, e.end_time, e.organizer_id 
             FROM participacoes p
             JOIN eventos e ON p.event_id = e.id
             WHERE p.user_id = $1 AND p.status = 'accepted' AND e.empresa_id = $2`,
            [user_id, req.empresaId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar eventos aceitos:", err);
        res.status(500).json({ error: "Erro interno ao listar eventos aceitos." });
    }
});

// ====================================================================
// 12. Rota POST /eventos/:id/participar (Participar de um Evento)
// ====================================================================
app.post("/eventos/:id/participar", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o evento existe e pertence à empresa
        const eventCheck = await pool.query("SELECT empresa_id FROM eventos WHERE id = $1", [id]);
        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        // Insere ou atualiza participação para 'accepted'
        const result = await pool.query(
            `INSERT INTO participacoes (event_id, user_id, status) 
             VALUES ($1, $2, 'accepted') 
             ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'accepted' 
             RETURNING *`,
            [id, req.userId]
        );

        res.json({ message: "Participação confirmada!", participation: result.rows[0] });

    } catch (err) {
        console.error("Erro ao participar do evento:", err);
        res.status(500).json({ error: "Erro interno ao participar do evento." });
    }
});

// ====================================================================
// 13. Rota DELETE /eventos/:id/sair (Sair de um Evento)
// ====================================================================
app.delete("/eventos/:id/sair", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o evento existe e pertence à empresa
        const eventCheck = await pool.query("SELECT empresa_id FROM eventos WHERE id = $1", [id]);
        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        // Remove a participação do usuário logado
        const result = await pool.query(
            "DELETE FROM participacoes WHERE event_id = $1 AND user_id = $2 RETURNING *",
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Você não está participando deste evento." });
        }

        res.json({ message: "Você saiu do evento." });

    } catch (err) {
        console.error("Erro ao sair do evento:", err);
        res.status(500).json({ error: "Erro interno ao sair do evento." });
    }
});

// ====================================================================
// 14. Rota GET /notificacoes (Listar Notificações)
// ====================================================================
app.get("/notificacoes", authorize, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM notificacoes WHERE user_id = $1 ORDER BY created_at DESC",
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar notificações:", err);
        // Se a tabela não existir, retorna array vazio para não quebrar o front
        if (err.code === '42P01') {
            return res.json([]);
        }
        res.status(500).json({ error: "Erro interno ao listar notificações." });
    }
});

// ====================================================================
// 15. Rota PUT /notificacoes/:id/read (Deletar após visualizar)
// ====================================================================
app.put("/notificacoes/:id/read", authorize, async (req, res) => {
    const { id } = req.params;
    try {
        // Deleta a notificação após ser visualizada
        await pool.query(
            "DELETE FROM notificacoes WHERE id = $1 AND user_id = $2",
            [id, req.userId]
        );
        res.json({ message: "Notificação removida." });
    } catch (err) {
        console.error("Erro ao remover notificação:", err);
        res.status(500).json({ error: "Erro interno ao remover notificação." });
    }
});

// ====================================================================
// 16. Rota POST /notificacoes/cleanup (Limpar Notificações Duplicadas) - TEMPORÁRIO
// ====================================================================
app.post("/notificacoes/cleanup", authorize, async (req, res) => {
    try {
        // Deletar notificações duplicadas, mantendo apenas a mais recente de cada tipo/evento/usuário
        const result = await pool.query(`
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
                    WHERE user_id = $1
                ) t
                WHERE rn > 1
            )
            RETURNING *
        `, [req.userId]);

        res.json({
            message: "Notificações duplicadas removidas com sucesso.",
            deleted_count: result.rows.length
        });
    } catch (err) {
        console.error("Erro ao limpar notificações:", err);
        res.status(500).json({ error: "Erro interno ao limpar notificações." });
    }
});

// =======================
// Inicializar servidor
// =======================
app.listen(PORT, () => console.log(`🚀 Serviço de eventos rodando na porta ${PORT}`));
