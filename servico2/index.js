const express = require("express");
const pool = require("../Banco/db");
const axios = require("axios");
const app = express();

app.use(express.json());

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

// ... (Resto do código do servico2/index.js)

// Rodar servidor
app.listen(3002, () => console.log("Serviço de eventos rodando na porta 3002"));
