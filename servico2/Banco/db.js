require("dotenv").config();
const { Pool } = require("pg");

// Configuração do pool de conexões
const pool = new Pool({
  // Se DATABASE_URL estiver definida (Heroku, Railway, etc), usa ela
  connectionString: process.env.DATABASE_URL,
  
  // Senão, usa as variáveis individuais (desenvolvimento local)
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  
  // SSL apenas se DATABASE_URL estiver definida (produção)
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
