const express = require("express");
const pool = require("./Banco/db"); // Assumindo um arquivo db.js com a conexão
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

// =======================
// Testar conexão com o banco
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
// Rota Auxiliar: Middleware de Verificação de Token
// =======================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Token não fornecido ou formato inválido." });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido ou expirado." });
    }
};

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
      "INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) RETURNING id, username",
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
// Login de usuário (Geração de JWT)
// =======================
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const userResult = await pool.query("SELECT id, username, password_hash FROM usuarios WHERE username = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Email ou senha inválidos." });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(senha, user.password_hash);

    if (match) {
      // Criação do Token JWT
      const token = jwt.sign({ userId: user.id, email: user.username }, JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({
        message: "Login bem-sucedido!",
        user: { id: user.id, email: user.username },
        token: token, // Retorna o token
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
// Listar todos os usuários (PROTEGIDA)
// =======================
app.get("/usuarios", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username FROM usuarios");
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
// Buscar usuário por ID (PROTEGIDA)
// =======================
app.get("/usuarios/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, username FROM usuarios WHERE id = $1", [id]);
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
app.listen(PORT, () => console.log(`🚀 Servidor de Usuários rodando na porta ${PORT}`));
