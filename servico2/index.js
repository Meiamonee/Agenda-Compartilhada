const express = require("express");
const pool = require("./Banco/db"); // Acesso ao banco de dados compartilhado
const cors = require('cors');
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(cors());

// Variável que armazena a URL base do Serviço de Usuários (Serviço 1)
const servico1Url = process.env.SERVICO1_URL; 

// ===============================================
// 1. Rota POST /eventos (Criação de Evento)
//    Usa: events, title, description, start_time, end_time, organizer_id.
// ===============================================
app.post("/eventos", async (req, res) => {
    // 🛑 O Frontend DEVE ENVIAR: { title, description, start_time, end_time, organizer_id }
    const { title, description, start_time, end_time, organizer_id } = req.body; 

    // Verificação explícita de campos obrigatórios
    if (!title || !start_time || !end_time || !organizer_id) {
        return res.status(400).json({ error: "Campos obrigatórios faltando: title, start_time, end_time e organizer_id." });
    }
    
    try {
        // 1. Coordenação: Verifica se o usuário (organizer_id) existe chamando o Serviço de Usuários
        await axios.get(`${servico1Url}/usuarios/${organizer_id}`);

        // 2. Coerência: Insere evento no banco com nomes de colunas e tabela corretos
        const result = await pool.query(
            "INSERT INTO events (title, description, start_time, end_time, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, start_time, end_time, organizer_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Tratamento de erro para falha na verificação de usuário (Serviço 1)
        if (err.response && err.response.status === 404) {
            return res.status(400).json({ 
                error: "Organizador (organizer_id) não encontrado no Serviço de Usuários." 
            });
        }
        
        console.error("Erro no servidor de eventos (POST /eventos):", err);
        res.status(500).json({ 
            error: "Erro interno ao criar evento. Verifique a URL do Serviço de Usuários e o formato TIMESTAMP das datas/horas." 
        });
    }
});

// ===============================================
// 2. Rota GET /eventos (Listar Eventos)
// ===============================================
app.get("/eventos", async (req, res) => {
    try {
        // Coerência: Usa a tabela correta 'events'
        const result = await pool.query("SELECT * FROM events ORDER BY start_time ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ error: "Erro interno no servidor ao listar eventos." });
    }
});

// ===============================================
// 3. Rota PUT /eventos/:id (Atualizar Evento)
//    Usa colunas corretas: title, description, start_time, end_time.
// ===============================================
app.put("/eventos/:id", async (req, res) => {
    const { id } = req.params;
    // 🛑 O Frontend DEVE ENVIAR: { title, description, start_time, end_time }
    const { title, description, start_time, end_time } = req.body; 
    try {
        // Coerência: Usa a tabela 'events' e colunas corretas
        const result = await pool.query(
            "UPDATE events SET title=$1, description=$2, start_time=$3, end_time=$4 WHERE id=$5 RETURNING *",
            [title, description, start_time, end_time, id]
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

// ===============================================
// 4. Rota DELETE /eventos/:id (Deletar Evento)
// ===============================================
app.delete("/eventos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Coerência: Usa a tabela correta 'events'
        const result = await pool.query(
            "DELETE FROM events WHERE id=$1 RETURNING *",
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


// ===============================================
// 5. Rota POST /eventos/:evento_id/participar
//    Usa tabela 'participations', colunas corretas (event_id, user_id) e 'status'.
// ===============================================
app.post("/eventos/:evento_id/participar", async (req, res) => {
    const { evento_id } = req.params;
    // Coerência: A coluna correta é user_id
    const { user_id } = req.body; 
    
    try {
        // Coerência: Insere na tabela 'participations' com 'status' obrigatório
        const result = await pool.query(
            "INSERT INTO participations (event_id, user_id, status) VALUES ($1, $2, 'confirmed') RETURNING *",
            [evento_id, user_id]
        );
        res.status(201).json({ 
            message: "Presença confirmada com sucesso!", 
            participacao: result.rows[0] 
        });
    } catch (err) {
        // Se a chave UNIQUE (user_id, event_id) já existir, retorna erro amigável (Código '23505' do PostgreSQL)
        if (err.code === '23505') {
             return res.status(409).json({ error: "Você já está participando deste evento." });
        }
        console.error("Erro ao confirmar presença:", err);
        res.status(500).json({ error: "Erro interno ao confirmar presença. Verifique se os IDs são válidos e se o banco está online." });
    }
});

// ===============================================
// 6. Rota GET /eventos/:evento_id/participantes (Coordenação de Microsserviços)
// ===============================================
app.get("/eventos/:evento_id/participantes", async (req, res) => {
    const { evento_id } = req.params;
    try {
        // 1. Coerência: Pega os IDs da tabela 'participations'
        const participantsResult = await pool.query(
            "SELECT user_id, status FROM participations WHERE event_id = $1",
            [evento_id]
        );
        
        const participantIds = participantsResult.rows.map(p => p.user_id);

        if (participantIds.length === 0) {
            return res.json([]); // Nenhum participante
        }

        // 2. Coordenação: Chama o Serviço de Usuários para obter os detalhes
        const participantsWithDetails = await Promise.all(
            participantIds.map(async (id) => {
                try {
                    const userResponse = await axios.get(`${servico1Url}/usuarios/${id}`); 
                    const status = participantsResult.rows.find(p => p.user_id === id)?.status;
                    return { ...userResponse.data, status };
                } catch (userErr) {
                    console.warn(`Detalhes do usuário ${id} não encontrados no Serviço de Usuários.`);
                    return { id: id, nome: "Usuário Desconhecido", status: participantsResult.rows.find(p => p.user_id === id)?.status };
                }
            })
        );

        res.json(participantsWithDetails);
    } catch (err) {
        console.error("Erro ao listar participantes:", err);
        res.status(500).json({ error: "Erro ao listar participantes. Verifique a URL do Serviço de Usuários." });
    }
});


// Corrigido: Usar a variável de ambiente PORT do Render ou 3002 como fallback
const PORT = process.env.PORT || 3002;

// Rodar servidor
app.listen(PORT, () => console.log(`Serviço de eventos rodando na porta ${PORT}`));
