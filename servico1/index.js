// Arquivo: servico-usuarios.js (Porta 3001)

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Configurações do ambiente: Use seus valores do .env aqui
const JWT_SECRET = process.env.JWT_SECRET || "dois_poneis_saltitam_pelo_campo";
const PORT = 3001;

// Configuração do Banco de Dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Configuração para Render/produção
});

const app = express();
app.use(cors());
app.use(express.json());

const saltRounds = 10;

// =======================
// Testar conexão com o banco...
// =======================
(async () => {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ Servico Usuários: Conectado ao banco com sucesso!");
        console.log("🕓 Hora do servidor PostgreSQL:", result.rows[0].now);
    } catch (err) {
        console.error("❌ Servico Usuários: Erro ao conectar ao banco:", err.message);
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
        req.empresaId = decoded.empresaId;
        req.isOwner = decoded.isOwner;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido ou expirado." });
    }
};

// =======================
// 🟢 Registro de Empresa e Dono (Transacional)
// =======================
app.post("/empresas", async (req, res) => {
    const { nome_empresa, email, senha } = req.body;

    if (!nome_empresa || !email || !senha) {
        return res.status(400).json({ error: "Nome da empresa, email e senha são obrigatórios." });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Inicia transação

        // 1. Cria a Empresa
        const empresaResult = await client.query(
            "INSERT INTO empresas (nome_empresa) VALUES ($1) RETURNING id",
            [nome_empresa]
        );
        const empresaId = empresaResult.rows[0].id;

        // 2. Cria o Dono (is_owner = TRUE)
        const hashedPassword = await bcrypt.hash(senha, saltRounds);
        const userResult = await client.query(
            "INSERT INTO usuarios (username, password_hash, empresa_id, is_owner) VALUES ($1, $2, $3, TRUE) RETURNING id, username",
            [email, hashedPassword, empresaId]
        );

        await client.query('COMMIT'); // Confirma transação

        const user = userResult.rows[0];
        const token = jwt.sign(
            { userId: user.id, email: user.username, empresaId: empresaId, isOwner: true },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: "Empresa e Dono registrados com sucesso!",
            empresa: { id: empresaId, nome: nome_empresa },
            user: { id: user.id, email: user.username, isOwner: true },
            token
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK'); // Desfaz em caso de erro
        console.error("Erro ao registrar empresa/dono:", err);
        if (err.code === "23505") {
            return res.status(409).json({ error: "Este email ou nome de empresa já está cadastrado." });
        }
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (client) client.release();
    }
});

// =======================
// Registro de Funcionário (APENAS Dono pode criar)
// =======================
app.post("/usuarios", verifyToken, async (req, res) => {
    const { email, senha, nome } = req.body;

    // 🛑 Autorização: Apenas o Dono pode criar funcionários
    if (!req.isOwner) {
        return res.status(403).json({ error: "Apenas o dono da empresa pode criar contas de funcionário." });
    }

    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, saltRounds);

        // Novo usuário pertence à mesma empresa do Dono logado (req.empresaId)
        const result = await pool.query(
            "INSERT INTO usuarios (username, password_hash, empresa_id, is_owner) VALUES ($1, $2, $3, FALSE) RETURNING id, username",
            [email, hashedPassword, req.empresaId]
        );

        const user = result.rows[0];
        res.status(201).json({
            id: user.id,
            email: user.username,
            nome: nome || "Funcionário",
            empresa_id: req.empresaId
        });
    } catch (err) {
        console.error("Erro ao registrar funcionário:", err);
        if (err.code === "23505") {
            return res.status(409).json({ error: "Este email já está cadastrado." });
        }
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// =======================
// Atualizar funcionário (Apenas Dono)
// =======================
app.put("/usuarios/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    // Verificar se é o dono da empresa
    if (!req.isOwner) {
        return res.status(403).json({ error: "Apenas o dono pode editar funcionários." });
    }

    try {
        // Verificar se o usuário pertence à mesma empresa
        const userCheck = await pool.query(
            "SELECT empresa_id, is_owner FROM usuarios WHERE id = $1",
            [id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (userCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(403).json({ error: "Você só pode editar funcionários da sua empresa." });
        }

        if (userCheck.rows[0].is_owner) {
            return res.status(403).json({ error: "Não é possível editar o dono da empresa." });
        }

        // Verificar se o novo email já existe (se foi alterado)
        if (email) {
            const emailCheck = await pool.query(
                "SELECT id FROM usuarios WHERE username = $1 AND id != $2",
                [email, id]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: "Este email já está em uso." });
            }
        }

        // Construir query de atualização dinamicamente
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nome) {
            updates.push(`nome = $${paramCount++}`);
            values.push(nome);
        }

        if (email) {
            updates.push(`username = $${paramCount++}`);
            values.push(email);
        }

        if (senha) {
            const hashedPassword = await bcrypt.hash(senha, saltRounds);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "Nenhum campo para atualizar." });
        }

        values.push(id);
        const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = $${paramCount}`;

        await pool.query(query, values);

        res.json({ message: "Funcionário atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao atualizar funcionário:", err);
        if (err.code === "23505") {
            return res.status(409).json({ error: "Este email já está cadastrado." });
        }
        res.status(500).json({ error: "Erro ao atualizar funcionário." });
    }
});

// =======================
// Deletar funcionário (Apenas Dono)
// =======================
app.delete("/usuarios/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    // Verificar se é o dono da empresa
    if (!req.isOwner) {
        return res.status(403).json({ error: "Apenas o dono pode deletar funcionários." });
    }

    try {
        // Verificar se o usuário pertence à mesma empresa
        const userCheck = await pool.query(
            "SELECT empresa_id, is_owner FROM usuarios WHERE id = $1",
            [id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (userCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(403).json({ error: "Você só pode deletar funcionários da sua empresa." });
        }

        if (userCheck.rows[0].is_owner) {
            return res.status(403).json({ error: "Não é possível deletar o dono da empresa." });
        }

        // Deletar o usuário
        await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

        res.json({ message: "Funcionário removido com sucesso!" });
    } catch (err) {
        console.error("Erro ao deletar funcionário:", err);
        res.status(500).json({ error: "Erro ao deletar funcionário." });
    }
});

// =======================
// Login de usuário (Geração de JWT com Empresa ID)
// =======================
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        const userResult = await pool.query("SELECT id, username, password_hash, empresa_id, is_owner FROM usuarios WHERE username = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Email ou senha inválidos." });
        }

        const user = userResult.rows[0];
        const match = await bcrypt.compare(senha, user.password_hash);

        if (match) {
            // ✅ Criação do Token JWT completo
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.username,
                    empresaId: user.empresa_id,
                    isOwner: user.is_owner
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({
                message: "Login bem-sucedido!",
                user: {
                    id: user.id,
                    email: user.username,
                    empresa_id: user.empresa_id,
                    isOwner: user.is_owner
                },
                token: token,
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
// Listar todos os usuários (da mesma empresa)
// =======================
app.get("/usuarios", verifyToken, async (req, res) => {
    try {
        // 🛑 Filtra usuários APENAS da empresa do usuário logado
        const result = await pool.query(
            "SELECT id, username, is_owner, created_at FROM usuarios WHERE empresa_id = $1 ORDER BY username ASC",
            [req.empresaId]
        );

        res.json(result.rows.map(user => ({
            id: user.id,
            email: user.username,
            is_owner: user.is_owner,
            created_at: user.created_at
        })));
    } catch (err) {
        console.error("Erro ao listar usuários:", err);
        res.status(500).json({ error: "Erro ao listar usuários." });
    }
});

// =======================
// Buscar usuário por ID (Restrito à própria empresa) - USADO PELO SERVICO 2
// =======================
app.get("/usuarios/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        // 🛑 Filtra pelo ID do usuário e pelo ID da empresa logada
        const result = await pool.query("SELECT id, username, empresa_id, is_owner FROM usuarios WHERE id = $1 AND empresa_id = $2", [id, req.empresaId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado nesta empresa." });
        }
        const user = result.rows[0];
        res.json({ id: user.id, email: user.username, empresa_id: user.empresa_id, is_owner: user.is_owner });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar usuário." });
    }
});

// =======================
// Buscar detalhes da empresa
// =======================
app.get("/empresas/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) !== req.empresaId) {
        return res.status(403).json({ error: "Você só pode visualizar detalhes da sua própria empresa." });
    }

    try {
        const result = await pool.query(
            "SELECT id, nome_empresa, created_at FROM empresas WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Empresa não encontrada." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao buscar empresa:", err);
        res.status(500).json({ error: "Erro ao buscar empresa." });
    }
});

// =======================
// Listar usuários de uma empresa (Apenas membros da empresa)
// =======================
app.get("/empresas/:id/usuarios", verifyToken, async (req, res) => {
    const { id } = req.params;

    // Verifica se o usuário está tentando acessar usuários da própria empresa
    if (parseInt(id) !== req.empresaId) {
        return res.status(403).json({ error: "Você só pode visualizar usuários da sua própria empresa." });
    }

    try {
        const result = await pool.query(
            "SELECT id, username, is_owner, created_at FROM usuarios WHERE empresa_id = $1 ORDER BY is_owner DESC, username ASC",
            [id]
        );

        res.json(result.rows.map(user => ({
            id: user.id,
            email: user.username,
            is_owner: user.is_owner,
            created_at: user.created_at
        })));
    } catch (err) {
        console.error("Erro ao listar usuários da empresa:", err);
        res.status(500).json({ error: "Erro ao listar usuários da empresa." });
    }
});

// =======================
// Atualizar informações da empresa (Apenas Dono)
// =======================
app.put("/empresas/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { nome_empresa } = req.body;

    if (parseInt(id) !== req.empresaId) {
        return res.status(403).json({ error: "Você só pode atualizar sua própria empresa." });
    }

    if (!req.isOwner) {
        return res.status(403).json({ error: "Apenas o dono da empresa pode atualizar informações." });
    }

    if (!nome_empresa) {
        return res.status(400).json({ error: "Nome da empresa é obrigatório." });
    }

    try {
        const result = await pool.query(
            "UPDATE empresas SET nome_empresa = $1 WHERE id = $2 RETURNING *",
            [nome_empresa, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Empresa não encontrada." });
        }

        res.json({ message: "Empresa atualizada com sucesso.", empresa: result.rows[0] });
    } catch (err) {
        console.error("Erro ao atualizar empresa:", err);
        if (err.code === "23505") {
            return res.status(409).json({ error: "Este nome de empresa já está em uso." });
        }
        res.status(500).json({ error: "Erro ao atualizar empresa." });
    }
});

// =======================
// Deletar funcionário (Apenas Dono)
// =======================
app.delete("/usuarios/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (!req.isOwner) {
        return res.status(403).json({ error: "Apenas o dono da empresa pode deletar funcionários." });
    }

    try {
        const userCheck = await pool.query(
            "SELECT id, empresa_id, is_owner FROM usuarios WHERE id = $1",
            [id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (userCheck.rows[0].empresa_id !== req.empresaId) {
            return res.status(403).json({ error: "Você só pode deletar usuários da sua própria empresa." });
        }

        if (userCheck.rows[0].is_owner) {
            return res.status(403).json({ error: "Não é possível deletar o dono da empresa." });
        }

        await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

        res.json({ message: "Funcionário deletado com sucesso." });
    } catch (err) {
        console.error("Erro ao deletar funcionário:", err);
        res.status(500).json({ error: "Erro ao deletar funcionário." });
    }
});


// =======================
// Inicializar servidor
// =======================
app.listen(PORT, () => console.log(`🚀 Servidor de Usuários rodando na porta ${PORT}`));