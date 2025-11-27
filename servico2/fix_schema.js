require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function fixSchema() {
    try {
        console.log("🔌 Conectando ao banco de dados...");
        const client = await pool.connect();
        console.log("✅ Conectado!");

        console.log("🛠️ Adicionando coluna 'is_public' à tabela 'eventos'...");
        await client.query(`
      ALTER TABLE eventos 
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
    `);
        console.log("✅ Coluna 'is_public' adicionada com sucesso!");

        client.release();
    } catch (err) {
        console.error("❌ Erro ao atualizar schema:", err);
    } finally {
        await pool.end();
    }
}

fixSchema();
