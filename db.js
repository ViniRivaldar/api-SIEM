const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao banco:', err.stack);
  }
  console.log('✅ Conectado ao PostgreSQL!');
  release();
});

module.exports = pool;