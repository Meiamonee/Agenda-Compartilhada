const express = require("express");
const pool = require("../Banco/db");
const cors = require('cors');
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(cors());
// Criar evento com verificação no serviço de usuários
app.post("/eventos", async (req, res) => {
  const { titulo, descricao, data, hora, usuario_id } = req.body;
  const servico1Url = process.env.SERVICO1_URL; // Usando a variável de ambiente

  try {
    // 1. Consulta no serviço de usuários
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

    res.json(result.rows[0]);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: err.message });
  }
});


// Listar eventos
app.get("/eventos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM eventos");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar evento
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

// Deletar evento
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
