require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function createNotificationsTable() {
    try {
        console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL ? "DEFINED" : "UNDEFINED");
        if (process.env.DATABASE_URL) {
            console.log("DEBUG: DATABASE_URL starts with", process.env.DATABASE_URL.substring(0, 10));
        }
        console.log("🔌 Conectando ao banco de dados...");
        const client = await pool.connect();
        console.log("✅ Conectado!");

        console.log("🛠️ Criando tabela 'notificacoes'...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notificacoes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'update', 'cancel'
                event_id INTEGER,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'notificacoes' criada com sucesso!");

        client.release();
    } catch (err) {
        console.error("❌ Erro ao criar tabela:", err);
    } finally {
        await pool.end();
    }
}

createNotificationsTable();
