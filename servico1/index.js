const express = require("express");
const pool = require("../Banco/db"); // Assume que a conexão do pool está configurada corretamente
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
const saltRounds = 10;
const PORT = 3001; // Usando porta estática, mas garantir que o Render use a variável de ambiente se estiver disponível

// =========================================================================================
// ATENÇÃO: Corrigido o nome da tabela (usuarios -> users) e colunas (email/senha -> username/password_hash)
// O campo 'username' está sendo usado para armazenar o email (se o frontend envia 'email').
// O campo 'password_hash' está sendo usado para armazenar a senha criptografada.
// =========================================================================================

// =======================
// Endpoint de registro (agora alinhado com a tabela 'users')
// =======================
app.post("/usuarios", async (req, res) => {
    // Nota: Se o frontend envia { nome, email, senha }, estamos usando 'email' como 'username'
    const { nome, email, senha } = req.body; 
    
    // Verificação de dados básicos
    if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, saltRounds);
        
        // CORREÇÃO AQUI: Tabela 'users', Colunas 'username' (para email) e 'password_hash'
        const result = await pool.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
            [email, hashedPassword]
        );
        
        // Retorna o usuário criado (com 'username' no lugar de 'email')
        const user = result.rows[0];
        res.status(201).json({ 
            id: user.id, 
            email: user.username, // Mapeando de volta para 'email' para o cliente
            nome: nome || 'Usuário' // Nome é opcional na sua nova tabela SQL
        });
        
    } catch (err) {
        console.error("Erro ao registrar usuário:", err);
        // Erro 23505 indica violação de UNIQUE constraint (email já existe)
        if (err.code === '23505') {
             return res.status(409).json({ error: "Este email já está cadastrado." });
        }
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// =======================
// Endpoint de login (agora alinhado com a tabela 'users')
// =======================
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    
    try {
        // CORREÇÃO AQUI: Tabela 'users' e Coluna 'username' (para email)
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Email ou senha inválidos." });
        }

        // CORREÇÃO AQUI: Coluna 'password_hash' (para senha)
        const storedPassword = userResult.rows[0].password_hash;
        const match = await bcrypt.compare(senha, storedPassword);

        if (match) {
            const { id, username } = userResult.rows[0];
            // Mapeando 'username' de volta para 'email' para o frontend
            res.status(200).json({ 
                message: "Login bem-sucedido!", 
                user: { id, email: username } // Ajuste aqui
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
// Listar todos usuários (agora alinhado com a tabela 'users')
// =======================
app.get("/usuarios", async (req, res) => {
    try {
        // CORREÇÃO AQUI: Tabela 'users'
        const result = await pool.query("SELECT id, username FROM users");
        
        // Mapeando 'username' de volta para 'email' na resposta
        const formattedUsers = result.rows.map(user => ({
            id: user.id,
            email: user.username
        }));
        
        res.json(formattedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao listar usuários." });
    }
});


// =======================
// Buscar usuário por ID (agora alinhado com a tabela 'users')
// =======================
app.get("/usuarios/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // CORREÇÃO AQUI: Tabela 'users'
        const result = await pool.query("SELECT id, username FROM users WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const user = result.rows[0];
        // Mapeando 'username' de volta para 'email' na resposta
        res.json({ id: user.id, email: user.username });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar usuário." });
    }
});

// As rotas PUT e DELETE foram omitidas, mas seguiriam a mesma lógica de renomear 'usuarios' para 'users' e 'email/senha' para 'username/password_hash'

// =======================
// Rodar servidor
// =======================
// Usando a variável de ambiente PORT do Render, caso exista, senão usa 3001
const serverPort = process.env.PORT || PORT; 

app.listen(serverPort, () => console.log(`Serviço 1 (Usuários) rodando na porta ${serverPort}`));
