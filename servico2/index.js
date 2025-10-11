const express = require("express");
const pool = require("../Banco/db"); // Acesso ao banco de dados compartilhado
const cors = require('cors');
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(cors()); // Permite requisições do seu front-end local

// Endpoint para Criar Evento com verificação no serviço de usuários
app.post("/eventos", async (req, res) => {
    const { titulo, descricao, data, hora, usuario_id } = req.body;
    // Variável de ambiente configurada no Render para acessar o outro serviço
    const servico1Url = process.env.SERVICO1_URL; 

    try {
        // 1. Verifica se o usuário existe chamando o serviço1
        const usuarioResponse = await axios.get(`${servico1Url}/usuarios/${usuario_id}`);
        const usuario = usuarioResponse.data;

        if (!usuario || !usuario.id) {
            return res.status(400).json({ error: "Usuário não encontrado" });
        }

        // 2. Insere evento no banco
        const result = await pool.query(
            "INSERT INTO eventos (titulo, descricao, data, hora, usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [titulo, descricao, data, hora, usuario_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return res.status(400).json({ error: "Usuário não encontrado no Serviço de Usuários (ID inválido)." });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// Endpoint NOVO: Confirmar presença em um evento
app.post("/eventos/:evento_id/participar", async (req, res) => {
    const { evento_id } = req.params;
    const { usuario_id } = req.body; // Espera que o ID do usuário seja enviado no body
    
    // NOTA: Em uma aplicação real, aqui você usaria um token de autenticação
    // para obter o usuario_id, mas vamos simplificar o teste.

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
        // Se a chave primária (usuario_id, evento_id) já existir, retorna erro amigável
        if (err.code === '23505') {
             return res.status(409).json({ error: "Você já está participando deste evento." });
        }
        console.error(err);
        res.status(500).json({ error: "Erro ao confirmar presença. Verifique se os IDs são válidos." });
    }
});

// Endpoint NOVO: Listar participantes de um evento
app.get("/eventos/:evento_id/participantes", async (req, res) => {
    const { evento_id } = req.params;
    try {
        const result = await pool.query(
            // Junta as tabelas para retornar o nome e email dos participantes
            "SELECT u.id AS usuario_id, u.nome, u.email, p.status FROM participantes p JOIN usuarios u ON u.id = p.usuario_id WHERE p.evento_id = $1",
            [evento_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao listar participantes." });
    }
});


// Listar todos os eventos (rota original)
app.get("/eventos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM eventos");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// Rodar servidor
app.listen(3002, () => console.log("Serviço de eventos rodando na porta 3002"));
