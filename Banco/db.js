const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",         // seu usuário configurado
  host: "localhost",
  database: "agenda",       // nome do banco criado no pgAdmin
  password: "030898",    // senha definida no Postgres
  port: 5432,
});

module.exports = pool;
