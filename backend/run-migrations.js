import { readFileSync } from "fs";
import { join } from "path";
import pool from "./config/database.js";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Read migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), "migrations", "001_initial.sql"),
      "utf8"
    );

    // Split by semicolons and filter empty statements
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await pool.query(statement);
        console.log("✓ Success");
      } catch (error) {
        // Ignore "already exists" errors for tables
        if (
          error.code === "42P07" ||
          error.message.includes("already exists")
        ) {
          console.log("⊘ Already exists, skipping");
        } else {
          console.error("✗ Error:", error.message);
          throw error;
        }
      }
    }

    console.log("✓ All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
