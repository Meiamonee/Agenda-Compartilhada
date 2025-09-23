const express = require("express");
const pool = require("../Banco/db");

const app = express();
app.use(express.json());

// =======================
// Criar usuário
// =======================
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *",
      [nome, email, senha]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Listar todos usuários
// =======================
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Buscar usuário por ID
// =======================
app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Atualizar usuário
// =======================
app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;
  try {
    const result = await pool.query(
      "UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4 RETURNING *",
      [nome, email, senha, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Deletar usuário
// =======================
app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário deletado com sucesso", usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Rodar servidor
// =======================
app.listen(3001, () => console.log("Serviço 1 (Usuários) rodando na porta 3001"));
