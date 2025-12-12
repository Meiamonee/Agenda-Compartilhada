
const express = require("express");
const { Pool } = require("pg");
const cors = require('cors');
const axios = require("axios");
const Opossum = require("opossum");
const jwt = require("jsonwebtoken");
const http = require('http'); 
const { Server } = require("socket.io"); 
const cron = require('node-cron'); 
require("dotenv").config();

// Configurações do ambiente: Use seus valores do .env aqui
const JWT_SECRET = process.env.JWT_SECRET || "dois_poneis_saltitam_pelo_campo";
const servico1Url = process.env.SERVICO1_URL || "http://localhost:3001";
const PORT = 3002;

// Configuração do Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Configuração para Render/produção
});

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Servidor HTTP e WebSockets
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// =================================
// Middleware de Autorização (JWT)
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
        req.empresaId = decoded.empresaId;
        req.isOwner = decoded.isOwner;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido ou expirado." });
    }
};

// =================================
// 🚨 Circuit Breaker (Tolerância a Falhas)
// =================================
async function callUserService(endpoint, token) {
    if (!servico1Url) {
        throw new Error("SERVICO1_URL não configurada.");
    }
    const response = await axios.get(`${servico1Url}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

const circuit = new Opossum(callUserService, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
});
circuit.on('open', () => console.warn('🛑 CIRCUIT BREAKER ABERTO: Serviço de Usuários está indisponível.'));
circuit.on('close', () => console.log('✅ CIRCUIT BREAKER FECHADO: Serviço de Usuários se recuperou.'));

async function getUserDetails(userId, token) {
    try {
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

// Helper para criar notificação
async function createNotification(userId, message, type, eventId) {
    try {
        // Insere notificação
        await pool.query(
            `INSERT INTO notificacoes (user_id, message, type, event_id) VALUES ($1, $2, $3, $4)`,
            [userId, message, type, eventId]
        );
        // Tenta enviar notificação em tempo real (não crítica)
        io.to(`user_${userId}`).emit('new_notification', message); 

    } catch (err) {
        console.error("Erro ao criar notificação:", err);
    }
}

// ===============================================
// 💬 Lógica do Chat (Socket.IO)
// ===============================================

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Token de autenticação não fornecido."));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
        socket.empresaId = decoded.empresaId;
        socket.join(`user_${decoded.userId}`); // Sala de notificação privada
        next();
    } catch (err) {
        next(new Error("Token inválido."));
    }
});

io.on('connection', (socket) => {
    console.log(`Usuário ${socket.userId} conectado via Socket.ID: ${socket.id}`);

    socket.on('join_event_chat', async (eventId) => {
        try {
            const eventCheck = await pool.query(
                "SELECT id FROM eventos WHERE id = $1 AND empresa_id = $2",
                [eventId, socket.empresaId]
            );

            if (eventCheck.rows.length === 0) {
                return socket.emit('chat_error', 'Evento não encontrado ou acesso negado.');
            }
            
            const participationCheck = await pool.query(
                "SELECT status FROM participacoes WHERE event_id = $1 AND user_id = $2",
                [eventId, socket.userId]
            );

            if (participationCheck.rows.length === 0 || participationCheck.rows[0].status === 'declined') {
                 return socket.emit('chat_error', 'Você não está participando deste evento.');
            }

            socket.join(`event_${eventId}`);
            socket.eventId = eventId;
            socket.emit('joined', `Juntou-se ao chat do evento ${eventId}`);

        } catch (error) {
            console.error("Erro ao juntar ao chat:", error);
            socket.emit('chat_error', 'Erro interno ao validar acesso.');
        }
    });

    socket.on('send_message', async (message) => {
        const { text } = message;
        if (!socket.eventId || !text) return;

        try {
            // Salvar a mensagem no banco
            await pool.query(
                "INSERT INTO chat_messages (event_id, sender_id, message) VALUES ($1, $2, $3)",
                [socket.eventId, socket.userId, text]
            );

            // Usa o token do handshake para autenticar no Serviço 1 (Usuários)
            const userDetails = await getUserDetails(socket.userId, socket.handshake.auth.token);
            
            // Broadcast da mensagem para todos na sala do evento
            io.to(`event_${socket.eventId}`).emit('receive_message', {
                text: text,
                senderId: socket.userId,
                senderEmail: userDetails.email,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("Erro ao salvar ou enviar mensagem de chat:", error);
            socket.emit('chat_error', 'Não foi possível enviar a mensagem.');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Usuário ${socket.userId} desconectado`);
    });
});

// ===================================================
// ⏰ Lógica de Limpeza Automática (Cron Job)
// Deleta eventos que passaram há mais de 1 mês
// ===================================================
cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Executando tarefa de limpeza de eventos antigos...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30); 
    
    const deleteQuery = `
        DELETE FROM eventos 
        WHERE end_time < $1
        RETURNING id, title;
    `;

    try {
        const result = await pool.query(deleteQuery, [oneMonthAgo]);
        console.log(`✅ ${result.rows.length} evento(s) antigo(s) deletado(s) com sucesso.`);
    } catch (err) {
        console.error("❌ Erro ao executar a limpeza de eventos antigos:", err.message);
    }
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo" 
});

// ===============================================
// Rota GET /eventos/:id/chat/messages (Histórico do Chat)
// ===============================================
app.get("/eventos/:id/chat/messages", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        const eventCheck = await pool.query(
            "SELECT empresa_id FROM eventos WHERE id = $1",
            [id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

        const messagesResult = await pool.query(
            "SELECT id, sender_id, message, created_at FROM chat_messages WHERE event_id = $1 ORDER BY created_at ASC",
            [id]
        );

        // Busca detalhes do remetente
        const messagesWithDetails = await Promise.all(
            messagesResult.rows.map(async (msg) => {
                try {
                    const userDetails = await getUserDetails(msg.sender_id, req.token);
                    return {
                        ...msg,
                        sender_email: userDetails.email
                    };
                } catch (err) {
                    return { ...msg, sender_email: "Usuário Desconhecido" };
                }
            })
        );

        res.json(messagesWithDetails);
    } catch (err) {
        const statusCode = err.status || 500;
        res.status(statusCode).json({ error: err.message || "Erro ao buscar histórico do chat." });
    }
});


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

        const result = await pool.query(
            "INSERT INTO eventos (title, description, start_time, end_time, organizer_id, is_public, empresa_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [title, description, start_time, end_time, organizer_id, is_public !== false, req.empresaId]
        );
        
        // Insere o organizador como participante aceito por padrão
        await pool.query(
            "INSERT INTO participacoes (event_id, user_id, status) VALUES ($1, $2, 'accepted')",
            [result.rows[0].id, organizer_id]
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
        const eventResult = await pool.query("SELECT organizer_id, empresa_id, title FROM eventos WHERE id = $1", [evento_id]);
        if (eventResult.rows.length === 0 || eventResult.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }
        if (eventResult.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode convidar pessoas." });
        }

        await Promise.all(user_ids.map(id => getUserDetails(id, req.token)));

        // Cria a sintaxe do SQL para INSERT ou UPDATE (ON CONFLICT)
        const values = user_ids.map((id, index) => `($${index * 2 + 1}, $${index * 2 + 2}, 'invited')`).join(',');
        const params = user_ids.flatMap(id => [evento_id, id]);

        const query = `
            INSERT INTO participacoes (event_id, user_id, status) 
            VALUES ${values} 
            ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'invited' 
            RETURNING *;
        `;

        const result = await pool.query(query, params);
        const eventTitle = eventResult.rows[0].title;

        // Notificar novos convidados
        for (const invitation of result.rows) {
             await createNotification(invitation.user_id, `Você foi convidado para o evento: "${eventTitle}"`, 'invite', evento_id);
        }

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

        if (participation.empresa_id !== req.empresaId || participation.user_id !== req.userId) {
            return res.status(403).json({ error: "Acesso negado: Você só pode atualizar suas próprias participações na sua empresa." });
        }

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
        const result = await pool.query("SELECT * FROM eventos WHERE empresa_id = $1 ORDER BY start_time ASC", [req.empresaId]);

        const eventsWithOrganizerEmail = await Promise.all(
            result.rows.map(async (event) => {
                try {
                    const userDetails = await getUserDetails(event.organizer_id, req.token);
                    return {
                        ...event,
                        organizer_email: userDetails.email
                    };
                } catch (err) {
                    return {
                        ...event,
                        organizer_email: "Email não disponível (Serviço de Usuários indisponível)"
                    };
                }
            })
        );

        res.json(eventsWithOrganizerEmail);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao listar eventos." });
    }
});

// ====================================================================
// 5. Rota GET /usuarios/:user_id/convites (Listar Convites de um Usuário)
// ====================================================================
app.get("/usuarios/:user_id/convites", authorize, async (req, res) => {
    const { user_id } = req.params;

    if (parseInt(user_id) !== req.userId && !req.isOwner) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    try {
        const result = await pool.query(
            `SELECT p.id AS participation_id, p.event_id, p.user_id, p.status, 
                    e.title, e.description, e.start_time, e.end_time, e.organizer_id 
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

    if (parseInt(user_id) !== req.userId && !req.isOwner) {
        return res.status(403).json({ error: "Acesso negado." });
    }

    try {
        const result = await pool.query(
            `SELECT p.id AS participation_id, p.event_id, p.user_id, p.status, 
                    e.id, e.title, e.description, e.start_time, e.end_time, e.organizer_id 
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
// 7. Rota GET /eventos/:id (Detalhes de um Evento Específico)
// ====================================================================
app.get("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;

    try {
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

// ====================================================================
// 8. Rota PUT /eventos/:id (Atualizar Evento) 
// ====================================================================
app.put("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;
    const { title, description, start_time, end_time, is_public } = req.body;

    try {
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
// 9. Rota DELETE /eventos/:id (Deletar Evento) 
// ====================================================================
app.delete("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;

    try {
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

        const participants = await pool.query("SELECT user_id FROM participacoes WHERE event_id = $1", [id]);
        const eventTitle = eventCheck.rows[0].title;

        // Deleta o evento (CASCADE)
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
// 10. Rota GET /eventos/:id/participantes (Listar Participantes) 
// ====================================================================
app.get("/eventos/:id/participantes", authorize, async (req, res) => {
    const { id } = req.params;

    try {
        const eventCheck = await pool.query(
            "SELECT id, empresa_id FROM eventos WHERE id = $1",
            [id]
        );

        if (eventCheck.rows.length === 0 || eventCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(404).json({ error: "Evento não encontrado nesta empresa." });
        }

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

        const participantsWithDetails = await Promise.all(
            participantsResult.rows.map(async (participant) => {
                try {
                    const userDetails = await getUserDetails(participant.user_id, req.token);
                    return {
                        ...participant,
                        user_email: userDetails.email,
                        is_owner: userDetails.is_owner 
                    };
                } catch (err) {
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


// =======================
// Inicializar servidor
// =======================
server.listen(PORT, () => console.log(`🚀 Serviço de eventos (HTTP/WS) rodando na porta ${PORT}`));