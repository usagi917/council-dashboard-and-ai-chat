import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile } from "fs/promises";
import { join } from "path";

// Mock fs/promises
vi.mock("fs/promises");

// Mock Supabase client
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

const mockSupabaseClient = {
  rpc: vi.fn(),
  from: vi.fn(() => mockQueryBuilder),
};

vi.mock("../src/adapters/supabase/client", () => ({
  createServerClient: () => mockSupabaseClient,
}));

// Import after mocks
const { verifyDatabaseSetup, readMigrationFile } = await import("./setup-db");

describe("Database Setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readMigrationFile", () => {
    it("should read the migration file successfully", async () => {
      const mockSqlContent = "CREATE EXTENSION IF NOT EXISTS vector;";
      vi.mocked(readFile).mockResolvedValue(mockSqlContent);

      const result = await readMigrationFile();

      expect(readFile).toHaveBeenCalledWith(
        join(process.cwd(), "src/adapters/supabase/migrations.sql"),
        "utf-8"
      );
      expect(result).toBe(mockSqlContent);
    });

    it("should throw error if migration file cannot be read", async () => {
      vi.mocked(readFile).mockRejectedValue(new Error("File not found"));

      await expect(readMigrationFile()).rejects.toThrow("File not found");
    });
  });

  describe("verifyDatabaseSetup", () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it("should verify database setup successfully", async () => {
      // Mock successful table queries
      mockQueryBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock successful RPC call
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ chunk_id: 1, similarity: 0.9 }],
        error: null,
      });

      const result = await verifyDatabaseSetup();

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        "Database verification completed successfully"
      );
      expect(result.tablesVerified).toEqual([
        "speeches",
        "speech_chunks",
        "speech_embeddings",
        "sns_posts",
        "highlights",
      ]);
    });

    it("should handle missing tables", async () => {
      // Mock table not found error for first table, success for others
      mockQueryBuilder.limit
        .mockResolvedValueOnce({
          data: null,
          error: {
            message: 'relation "speeches" does not exist',
            code: "42P01",
          },
        })
        .mockResolvedValue({ data: [], error: null });

      // Mock RPC success (it won't be reached in this case since we have missing tables)
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ chunk_id: 1, similarity: 0.9 }],
        error: null,
      });

      const result = await verifyDatabaseSetup();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Database verification failed");
      expect(result.missingTables).toContain("speeches");
    });

    it("should handle RPC function verification failure", async () => {
      // Mock successful table queries
      mockQueryBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock RPC function not found
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "function match_speech_chunks does not exist" },
      });

      const result = await verifyDatabaseSetup();

      expect(result.success).toBe(false);
      expect(result.message).toContain("RPC function verification failed");
    });
  });
});
