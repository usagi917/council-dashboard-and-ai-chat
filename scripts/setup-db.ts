#!/usr/bin/env node
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { join } from "path";
import { createServerClient } from "../src/adapters/supabase/client";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
  tablesVerified?: string[];
  missingTables?: string[];
  rpcFunctionVerified?: boolean;
}

export async function readMigrationFile(): Promise<string> {
  const migrationPath = join(
    process.cwd(),
    "src/adapters/supabase/migrations.sql"
  );
  return await readFile(migrationPath, "utf-8");
}

export async function verifyDatabaseSetup(): Promise<VerificationResult> {
  try {
    console.log("🔍 Verifying database setup...");

    // Create Supabase client
    const supabase = createServerClient();

    const requiredTables = [
      "speeches",
      "speech_chunks",
      "speech_embeddings",
      "sns_posts",
      "highlights",
    ];
    const verifiedTables: string[] = [];
    const missingTables: string[] = [];

    // Verify each table exists by trying to query it
    for (const tableName of requiredTables) {
      console.log(`📊 Checking table: ${tableName}`);

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .limit(1);

      if (error) {
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.log(`❌ Table ${tableName} does not exist`);
          missingTables.push(tableName);
        } else {
          console.log(
            `⚠️  Table ${tableName} exists but query failed:`,
            error.message
          );
          verifiedTables.push(tableName); // Table exists, just has no data or permissions issue
        }
      } else {
        console.log(`✅ Table ${tableName} verified`);
        verifiedTables.push(tableName);
      }
    }

    // Verify RPC function exists
    console.log("🔍 Checking RPC function: match_speech_chunks");
    let rpcVerified = false;

    try {
      // Test the RPC function with dummy data
      const testEmbedding = new Array(3072).fill(0.1);
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "match_speech_chunks",
        {
          query_embedding: testEmbedding,
          match_count: 1,
          match_threshold: 0.0,
        }
      );

      if (rpcError) {
        if (rpcError.message.includes("does not exist")) {
          console.log("❌ RPC function match_speech_chunks does not exist");
        } else {
          console.log(
            "✅ RPC function match_speech_chunks verified (no data to match is expected)"
          );
          rpcVerified = true;
        }
      } else {
        console.log("✅ RPC function match_speech_chunks verified");
        rpcVerified = true;
      }
    } catch (error) {
      console.log("❌ RPC function verification failed:", error);
    }

    // Summary
    const allTablesExist = missingTables.length === 0;
    const success = allTablesExist && rpcVerified;

    if (success) {
      console.log("🎉 Database verification completed successfully!");
      console.log(`✅ All ${verifiedTables.length} tables verified`);
      console.log("✅ RPC function verified");

      return {
        success: true,
        message: "Database verification completed successfully",
        tablesVerified: verifiedTables,
        rpcFunctionVerified: rpcVerified,
      };
    } else {
      let message = "Database verification failed";

      if (missingTables.length > 0) {
        message += ` - Missing tables: ${missingTables.join(", ")}`;
      }

      if (!rpcVerified) {
        message += " - RPC function verification failed";
      }

      console.log("❌", message);
      console.log("");
      console.log("📖 To set up the database, please:");
      console.log("1. Open your Supabase dashboard");
      console.log("2. Go to SQL Editor");
      console.log(
        "3. Run the migration file: src/adapters/supabase/migrations.sql"
      );
      console.log("4. Run this verification script again");

      return {
        success: false,
        message,
        tablesVerified: verifiedTables,
        missingTables,
        rpcFunctionVerified: rpcVerified,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Database verification failed:", errorMessage);

    return {
      success: false,
      message: "Database verification failed",
      error: errorMessage,
    };
  }
}

// CLI execution
if (import.meta.url.endsWith(process.argv[1])) {
  verifyDatabaseSetup()
    .then((result) => {
      if (result.success) {
        console.log("🎉 Verification complete!");
        process.exit(0);
      } else {
        console.error("💥 Verification failed:", result.message);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Unexpected error:", error);
      process.exit(1);
    });
}
