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

    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'accepted' ou 'declined'." });
    }
    
    try {
        // Autorização: Verifica se a participação pertence ao usuário logado
        const participationCheck = await pool.query("SELECT user_id FROM participacoes WHERE id = $1", [id]);
        if (participationCheck.rows.length === 0 || participationCheck.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: "Você não tem permissão para modificar esta participação." });
        }

        const result = await pool.query(
            "UPDATE participacoes SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        res.json({ message: `Status atualizado para: ${status}`, participacao: result.rows[0] });
    } catch (err) {
        console.error("Erro ao atualizar status de participação:", err);
        res.status(500).json({ error: "Erro interno ao atualizar participação." });
    }
});


// ====================================================================
// 4. Rota GET /usuarios/:user_id/convites (Caixa de Convites Pendentes) - ISOLADA
// ====================================================================
app.get("/usuarios/:user_id/convites", authorize, async (req, res) => {
    const { user_id } = req.params;
    if (user_id !== req.userId.toString()) {
        return res.status(403).json({ error: "Você só pode visualizar seus próprios convites." });
    }

    try {
        // 🛑 Filtra os convites de eventos que pertencem à empresa do usuário logado
        const invitesResult = await pool.query(
            `SELECT 
                e.*, 
                p.id AS participation_id 
             FROM eventos e
             JOIN participacoes p ON e.id = p.event_id
             WHERE p.user_id = $1 
               AND p.status = 'invited'
               AND e.empresa_id = $2
             ORDER BY e.start_time ASC`, 
            [user_id, req.empresaId]
        );

        res.json(invitesResult.rows);
    } catch (err) {
        console.error("Erro ao listar convites:", err);
        res.status(500).json({ error: "Erro interno ao buscar convites." });
    }
});

// ====================================================================
// 5. Rota GET /usuarios/:user_id/aceitos (Caixa de Reuniões Aceitas) - ISOLADA
// ====================================================================
app.get("/usuarios/:user_id/aceitos", authorize, async (req, res) => {
    const { user_id } = req.params;
    if (user_id !== req.userId.toString()) {
        return res.status(403).json({ error: "Você só pode visualizar suas reuniões aceitas." });
    }

    try {
        // 🛑 Filtra os eventos aceitos que pertencem à empresa do usuário logado
        const acceptedResult = await pool.query(
            `SELECT 
                e.*, 
                p.id AS participation_id 
             FROM eventos e
             JOIN participacoes p ON e.id = p.event_id
             WHERE p.user_id = $1 
               AND p.status = 'accepted'
               AND e.empresa_id = $2
             ORDER BY e.start_time ASC`, 
            [user_id, req.empresaId]
        );

        res.json(acceptedResult.rows);
    } catch (err) {
        console.error("Erro ao listar reuniões aceitas:", err);
        res.status(500).json({ error: "Erro interno ao buscar reuniões aceitas." });
    }
});


// =================================================================
// 6. Rota GET /eventos (Reuniões Livres / Todos os Eventos) - ISOLADA
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

// ... (Rotas 7, 8, 9, 10, 11 atualizadas para verificar se o evento pertence à empresa)
// ... A lógica é similar, garantindo que o `req.empresaId` esteja sempre no `WHERE` das consultas.

// =======================
// Inicializar servidor
// =======================
app.listen(PORT, () => console.log(`🚀 Serviço de eventos rodando na porta ${PORT}`));