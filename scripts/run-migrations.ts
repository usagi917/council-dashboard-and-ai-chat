#!/usr/bin/env node
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function runMigrations() {
  try {
    console.log("🔧 Database Migration Guide");
    console.log("==========================");

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "src/adapters/supabase/migrations.sql"
    );
    const migrationSQL = await readFile(migrationPath, "utf-8");

    console.log("📄 Migration file loaded from: src/adapters/supabase/migrations.sql");
    console.log("");

    console.log("🔧 MANUAL SETUP REQUIRED:");
    console.log("1. Open your Supabase dashboard: https://supabase.com/dashboard");
    console.log("2. Select your project: razxbdkrwkcedxqdmjwg"); 
    console.log("3. Go to SQL Editor (left sidebar)");
    console.log("4. Create a new query and paste the following SQL:");
    console.log("");
    console.log("=" + "=".repeat(60));
    console.log(migrationSQL);
    console.log("=" + "=".repeat(60));
    console.log("");
    console.log("5. Click 'Run' to execute the migration");
    console.log("6. Run 'pnpm setup-db' to verify the setup");
    console.log("");
    
    // Try to run verification anyway to see current status
    console.log("📋 Current database status:");
    try {
      const { verifyDatabaseSetup } = await import('./setup-db');
      const result = await verifyDatabaseSetup();
      
      if (result.success) {
        console.log("✅ Database is already properly set up!");
        process.exit(0);
      } else {
        console.log("❌ Database setup incomplete:", result.message);
        if (result.missingTables && result.missingTables.length > 0) {
          console.log("🔍 Missing tables:", result.missingTables.join(", "));
        }
      }
    } catch (error) {
      console.log("❌ Could not verify database status:", error);
    }
    
    console.log("");
    console.log("💡 After running the SQL migration, the application should work correctly.");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Migration script failed:", errorMessage);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1])) {
  runMigrations();
}