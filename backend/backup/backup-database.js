#!/usr/bin/env node

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "angry_queers_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "angry_queers",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

async function backupTable(tableName) {
  try {
    console.log(`📊 Backing up ${tableName} table...`);

    // Get all data from the table
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id`);

    // Create backup data with metadata
    const backupData = {
      table_name: tableName,
      backup_date: new Date().toISOString(),
      record_count: result.rows.length,
      data: result.rows,
    };

    // Write to JSON file
    const filename = `${tableName}_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log(`✅ ${tableName} backup completed: ${filename}`);
    console.log(`   📄 Records backed up: ${result.rows.length}`);
    console.log(`   📁 File location: ${filepath}`);

    return {
      success: true,
      filename,
      filepath,
      recordCount: result.rows.length,
    };
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log("🚀 Starting database backup process...\n");

  const tables = []; // Add table names here to backup specific tables
  
  if (tables.length === 0) {
    console.log("ℹ️  No tables specified for backup.");
    console.log("   Add table names to the 'tables' array to enable backup.");
    return;
  }
  
  const results = [];

  for (const table of tables) {
    const result = await backupTable(table);
    results.push({ table, ...result });
    console.log(""); // Add spacing between tables
  }

  // Summary
  console.log("📋 Backup Summary:");
  console.log("==================");

  let totalRecords = 0;
  let successCount = 0;

  results.forEach(({ table, success, filename, recordCount, error }) => {
    if (success) {
      console.log(`✅ ${table}: ${recordCount} records → ${filename}`);
      totalRecords += recordCount;
      successCount++;
    } else {
      console.log(`❌ ${table}: Failed - ${error}`);
    }
  });

  console.log(`\n📊 Total: ${successCount}/${tables.length} tables backed up`);
  console.log(`📄 Total records: ${totalRecords}`);

  if (successCount === tables.length) {
    console.log("\n🎉 All backups completed successfully!");
  } else {
    console.log("\n⚠️  Some backups failed. Check the errors above.");
    process.exit(1);
  }
}

// Handle cleanup and errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\n🛑 Backup interrupted by user");
  await pool.end();
  process.exit(0);
});

// Run the backup
main()
  .then(async () => {
    await pool.end();
    console.log("\n🔌 Database connection closed");
  })
  .catch(async (error) => {
    console.error("❌ Backup failed:", error);
    await pool.end();
    process.exit(1);
  });
