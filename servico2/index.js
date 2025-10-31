const express = require("express");
const pool = require("./Banco/db"); // Acesso ao banco de dados compartilhado
const cors = require('cors');
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(cors());

// =======================
// Criação de Evento - CORRIGIDA
// =======================
app.post("/eventos", async (req, res) => {
    // Agora esperamos o ID do organizador, horário de início e FIM
    const { title, description, start_time, end_time, organizer_id } = req.body; 
    
    // Variável de ambiente configurada no Render para acessar o outro serviço
    const servico1Url = process.env.SERVICO1_URL; 

    try {
        // 1. Verifica se o usuário (organizer) existe chamando o serviço1
        const usuarioResponse = await axios.get(`${servico1Url}/usuarios/${organizer_id}`);
        // Se chegar aqui sem erro, o usuário existe.

        // 2. Insere evento no banco com nomes de colunas e campos corretos
        const result = await pool.query(
            "INSERT INTO events (title, description, start_time, end_time, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, start_time, end_time, organizer_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        // ... (Tratamento de erro igual ao original) ...
        if (err.response) {
            if (err.response.status === 404) {
                return res.status(400).json({ 
                    error: "Organizador não encontrado no Serviço de Usuários (ID inválido)." 
                });
            }
        }
        console.error("Erro no servidor de eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao criar evento." });
    }
});


// Endpoint NOVO: Confirmar presença em um evento
app.post("/eventos/:evento_id/participar", async (req, res) => {
    const { evento_id } = req.params;
    const { usuario_id } = req.body; // Espera que o ID do usuário seja enviado no body
    
    try {
        // Tenta inserir na tabela participantes
        const result = await pool.query(
            "INSERT INTO participantes (evento_id, usuario_id) VALUES ($1, $2) RETURNING *",
            [evento_id, usuario_id]
        );
        res.status(201).json({ 
            message: "Presença confirmada com sucesso!", 
            participacao: result.rows[0] 
        });
    } catch (err) {
        // Se a chave primária (usuario_id, evento_id) já existir, retorna erro amigável (Código '23505' do PostgreSQL)
        if (err.code === '23505') {
             return res.status(409).json({ error: "Você já está participando deste evento." });
        }
        console.error("Erro ao confirmar presença:", err);
        res.status(500).json({ error: "Erro interno ao confirmar presença. Verifique se os IDs são válidos e se o banco está online." });
    }
});

// Endpoint Listar participantes de um evento
app.get("/eventos/:evento_id/participantes", async (req, res) => {
    const { evento_id } = req.params;
    try {
        // Nota: Essa query pressupõe que há uma tabela 'usuarios' no MESMO banco. 
        // Se a tabela 'usuarios' estiver no SERVIÇO1, você precisará usar o axios novamente aqui.
        const result = await pool.query(
            // Junta as tabelas para retornar o nome e email dos participantes
            "SELECT u.id AS usuario_id, u.nome, u.email, p.status FROM participantes p JOIN usuarios u ON u.id = p.usuario_id WHERE p.evento_id = $1",
            [evento_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar participantes:", err);
        res.status(500).json({ error: "Erro ao listar participantes. Verifique se a tabela 'usuarios' está acessível." });
    }
});


// Listar todos os eventos (rota original)
app.get("/eventos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM eventos");
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao listar eventos." });
    }
});

// Atualizar evento (rota original)
app.put("/eventos/:id", async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, data, hora } = req.body;
    try {
        const result = await pool.query(
            "UPDATE eventos SET titulo=$1, descricao=$2, data=$3, hora=$4 WHERE id=$5 RETURNING *",
            [titulo, descricao, data, hora, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar evento:", err);
        res.status(500).json({ error: "Erro interno no servidor ao atualizar evento." });
    }
});

// Deletar evento (rota original)
app.delete("/eventos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "DELETE FROM eventos WHERE id=$1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        res.json({ message: "Evento deletado com sucesso", evento: result.rows[0] });
    } catch (err) {
        console.error("Erro ao deletar evento:", err);
        res.status(500).json({ error: "Erro interno no servidor ao deletar evento." });
    }
});

// Corrigido: Usar a variável de ambiente PORT do Render ou 3002 como fallback
const PORT = process.env.PORT || 3002;

// Rodar servidor
app.listen(PORT, () => console.log(`Serviço de eventos rodando na porta ${PORT}`));
