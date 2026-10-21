const mysql = require("mysql2/promise");

const port = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT debe ser un numero entero entre 1 y 65535.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "municipalidad_chinchao",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;