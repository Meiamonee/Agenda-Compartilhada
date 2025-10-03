const express = require("express");
const pool = require("../Banco/db");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
const saltRounds = 10;

// =======================
// Criar usuário
// =======================
/* 
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
*/
// Endpoint de registro (agora com senha criptografada)
app.post("/usuarios", async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, saltRounds);
        const result = await pool.query(
            "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
            [nome, email, hashedPassword]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// Endpoint de login
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Email ou senha inválidos." });
        }

        const storedPassword = user.rows[0].senha;
        const match = await bcrypt.compare(senha, storedPassword);

        if (match) {
            const { id, nome, email } = user.rows[0];
            res.status(200).json({ message: "Login bem-sucedido!", user: { id, nome, email } });
        } else {
            res.status(400).json({ error: "Email ou senha inválidos." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro no servidor." });
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
