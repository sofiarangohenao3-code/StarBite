import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'starbite',
});

console.log('✅ Conectado a MySQL');

export default db;