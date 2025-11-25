const express = require("express");
const pool = require("./Banco/db"); // Assumindo um arquivo db.js com a conexão
const cors = require('cors');
const axios = require("axios");
const Opossum = require("opossum"); // Circuit Breaker
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Variáveis de ambiente
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
// Middleware de Autorização (Tópico 9: Segurança)
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
        req.token = token; // Armazena o token para uso no Circuit Breaker
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
        return await circuit.fire(`/usuarios/${userId}`, token);
    } catch (err) {
        if (err.name === 'CircuitBreakerOpenError') {
             const serviceUnavailable = new Error("Serviço de Usuários temporariamente indisponível (Circuit Breaker Aberto).");
             serviceUnavailable.status = 503;
             throw serviceUnavailable;
        }

        if (err.response && err.response.status === 404) {
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
    const { title, description, start_time, end_time, organizer_id } = req.body;

    if (req.userId !== organizer_id) {
         return res.status(403).json({ error: "A criação de evento deve ser feita com o ID do usuário logado." });
    }
    
    if (!title || !start_time || !end_time || !organizer_id) {
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }
    
    try {
        // Coordenação: Verifica se o organizador existe (usa Circuit Breaker)
        await getUserDetails(organizer_id, req.token);

        const result = await pool.query(
            "INSERT INTO events (title, description, start_time, end_time, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, start_time, end_time, organizer_id]
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
        // Coerência: Verifica se o usuário logado é o organizador
        const eventResult = await pool.query("SELECT organizer_id FROM events WHERE id = $1", [evento_id]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: "Evento não encontrado." });
        }
        if (eventResult.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode convidar pessoas." });
        }

        // Coordenação: Verifica a existência de TODOS os usuários (usa Circuit Breaker)
        await Promise.all(user_ids.map(id => getUserDetails(id, req.token)));

        // Insere convites (status='invited')
        const values = user_ids.map((id, index) => `($${index * 2 + 1}, $${index * 2 + 2}, 'invited')`).join(',');
        const params = user_ids.flatMap(id => [evento_id, id]);

        const query = `
            INSERT INTO participations (event_id, user_id, status) 
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

    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'accepted' ou 'declined'." });
    }
    
    try {
        // Coerência: Verifica se a participação pertence ao usuário logado
        const participationCheck = await pool.query("SELECT user_id FROM participations WHERE id = $1", [id]);
        if (participationCheck.rows.length === 0 || participationCheck.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: "Você não tem permissão para modificar esta participação." });
        }

        const result = await pool.query(
            "UPDATE participations SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        res.json({ message: `Status atualizado para: ${status}`, participacao: result.rows[0] });
    } catch (err) {
        console.error("Erro ao atualizar status de participação:", err);
        res.status(500).json({ error: "Erro interno ao atualizar participação." });
    }
});


// ====================================================================
// 4. Rota GET /usuarios/:user_id/convites (Caixa de Convites Pendentes)
// ====================================================================
app.get("/usuarios/:user_id/convites", authorize, async (req, res) => {
    const { user_id } = req.params;
    // Autorização: Só permite ver os próprios convites
    if (user_id !== req.userId.toString()) {
        return res.status(403).json({ error: "Você só pode visualizar seus próprios convites." });
    }

    try {
        const invitesResult = await pool.query(
            `SELECT 
                e.*, 
                p.id AS participation_id 
             FROM events e
             JOIN participations p ON e.id = p.event_id
             WHERE p.user_id = $1 AND p.status = 'invited'
             ORDER BY e.start_time ASC`, 
            [user_id]
        );

        res.json(invitesResult.rows);
    } catch (err) {
        console.error("Erro ao listar convites:", err);
        res.status(500).json({ error: "Erro interno ao buscar convites." });
    }
});

// ====================================================================
// 5. Rota GET /usuarios/:user_id/aceitos (Caixa de Reuniões Aceitas)
// ====================================================================
app.get("/usuarios/:user_id/aceitos", authorize, async (req, res) => {
    const { user_id } = req.params;
    // Autorização: Só permite ver as próprias reuniões aceitas
    if (user_id !== req.userId.toString()) {
        return res.status(403).json({ error: "Você só pode visualizar suas reuniões aceitas." });
    }

    try {
        const acceptedResult = await pool.query(
            `SELECT 
                e.*, 
                p.id AS participation_id 
             FROM events e
             JOIN participations p ON e.id = p.event_id
             WHERE p.user_id = $1 AND p.status = 'accepted'
             ORDER BY e.start_time ASC`, 
            [user_id]
        );

        res.json(acceptedResult.rows);
    } catch (err) {
        console.error("Erro ao listar reuniões aceitas:", err);
        res.status(500).json({ error: "Erro interno ao buscar reuniões aceitas." });
    }
});


// =================================================================
// 6. Rota GET /eventos (Reuniões Livres / Todos os Eventos)
// =================================================================
app.get("/eventos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM events ORDER BY start_time ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao listar eventos." });
    }
});

// ===============================================
// 7. Rota PUT /eventos/:id (Atualizar Evento) - Protegida
// ===============================================
app.put("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;
    const { title, description, start_time, end_time } = req.body; 
    try {
        // Autorização: Verifica se o usuário logado é o organizador
        const checkOrganizer = await pool.query("SELECT organizer_id FROM events WHERE id = $1", [id]);
        if (checkOrganizer.rows.length === 0) return res.status(404).json({ error: "Evento não encontrado" });
        if (checkOrganizer.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode atualizar o evento." });
        }

        const result = await pool.query(
            "UPDATE events SET title=$1, description=$2, start_time=$3, end_time=$4 WHERE id=$5 RETURNING *",
            [title, description, start_time, end_time, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar evento:", err);
        res.status(500).json({ error: "Erro interno no servidor ao atualizar evento." });
    }
});

// ===============================================
// 8. Rota DELETE /eventos/:id (Deletar Evento) - Protegida
// ===============================================
app.delete("/eventos/:id", authorize, async (req, res) => {
    const { id } = req.params;
    try {
        // Autorização: Verifica se o usuário logado é o organizador
        const checkOrganizer = await pool.query("SELECT organizer_id FROM events WHERE id = $1", [id]);
        if (checkOrganizer.rows.length === 0) return res.status(404).json({ error: "Evento não encontrado" });
        if (checkOrganizer.rows[0].organizer_id !== req.userId) {
            return res.status(403).json({ error: "Apenas o organizador pode deletar o evento." });
        }
        
        // Exclui participações relacionadas (para evitar erro de chave estrangeira)
        await pool.query("DELETE FROM participations WHERE event_id = $1", [id]);
        
        const result = await pool.query(
            "DELETE FROM events WHERE id=$1 RETURNING *",
            [id]
        );

        res.json({ message: "Evento deletado com sucesso", evento: result.rows[0] });
    } catch (err) {
        console.error("Erro ao deletar evento:", err);
        res.status(500).json({ error: "Erro interno no servidor ao deletar evento." });
    }
});


// =================================================================
// 9. Rota GET /eventos/:evento_id/participantes (Listar Participantes) - Protegida
// =================================================================
app.get("/eventos/:evento_id/participantes", authorize, async (req, res) => {
    const { evento_id } = req.params;
    try {
        const participantsResult = await pool.query(
            "SELECT user_id, status, id AS participation_id FROM participations WHERE event_id = $1",
            [evento_id]
        );
        
        if (participantsResult.rows.length === 0) {
            return res.json([]); 
        }

        // Coordenação: Obtém detalhes dos participantes usando o Circuit Breaker
        const participantsWithDetails = await Promise.all(
            participantsResult.rows.map(async (p) => {
                try {
                    // Tenta obter detalhes do usuário
                    const userDetails = await getUserDetails(p.user_id, req.token);
                    return { ...userDetails, status: p.status, participation_id: p.participation_id };
                } catch (userErr) {
                    // Se o usuário não for encontrado no Serviço 1 (e o Circuit Breaker não estiver aberto)
                    console.warn(`Detalhes do usuário ${p.user_id} não encontrados.`);
                    return { id: p.user_id, email: "Usuário Desconhecido (Falha na Coordenação)", status: p.status, participation_id: p.participation_id };
                }
            })
        );

        res.json(participantsWithDetails);
    } catch (err) {
        const statusCode = err.status || 500;
        res.status(statusCode).json({ error: err.message || "Erro ao listar participantes." });
    }
});

// =======================
// Inicializar servidor
// =======================
app.listen(PORT, () => console.log(`🚀 Serviço de eventos rodando na porta ${PORT}`));
