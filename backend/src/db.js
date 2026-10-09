import pg from "pg";

// Pool de conexiones: reutiliza conexiones en vez de abrir una por petición
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export function query(text, params) {
  return pool.query(text, params);
}
