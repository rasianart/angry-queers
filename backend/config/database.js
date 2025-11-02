import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Use DATABASE_URL if available (for Render and other cloud providers)
// Otherwise fall back to individual connection parameters (for local development)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      user: process.env.DB_USER || "angry_queers_user",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "angry_queers",
      password: process.env.DB_PASSWORD || "password",
      port: process.env.DB_PORT || 5432,
    });

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

export default pool;
