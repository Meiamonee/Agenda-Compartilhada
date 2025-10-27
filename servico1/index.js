const express = require("express");
const cors = require("cors"); // 👈 ADICIONE ESTA LINHA
const pool = require("./Banco/db");
const bcrypt = require("bcrypt");
require("dotenv").config(); // 👈 garante que o .env seja lido


const app = express();
app.use(cors());
app.use(express.json());
const saltRounds = 10;

// Porta
const PORT = process.env.PORT || 3001;

// =======================
// Testar conexão com o banco Render
// =======================
(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conectado ao banco com sucesso!");
    console.log("🕓 Hora do servidor PostgreSQL:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
  }
})();

// =======================
// Registro de usuário
// =======================
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [email, hashedPassword]
    );

    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      email: user.username,
      nome: nome || "Usuário",
    });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Este email já está cadastrado." });
    }
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// =======================
// Login de usuário
// =======================
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Email ou senha inválidos." });
    }

    const storedPassword = userResult.rows[0].password_hash;
    const match = await bcrypt.compare(senha, storedPassword);

    if (match) {
      const { id, username } = userResult.rows[0];
      res.status(200).json({
        message: "Login bem-sucedido!",
        user: { id, email: username },
      });
    } else {
      res.status(400).json({ error: "Email ou senha inválidos." });
    }
  } catch (err) {
    console.error("Erro no processo de login:", err);
    res.status(500).json({ error: "Erro no servidor. Tente novamente." });
  }
});

// =======================
// Listar todos os usuários
// =======================
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username FROM users");
    const formattedUsers = result.rows.map((user) => ({
      id: user.id,
      email: user.username,
    }));
    res.json(formattedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// =======================
// Buscar usuário por ID
// =======================
app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, username FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    const user = result.rows[0];
    res.json({ id: user.id, email: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

// =======================
// Inicializar servidor
// =======================
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
