import { describe, it, expect, beforeEach, vi } from "vitest";
import { getRepos, getVectorSearch, clearContainer } from "./container";
import {
  InMemorySpeechesRepo,
  InMemoryHighlightsRepo,
  InMemorySnsRepo,
} from "./adapters/inmemory/repositories";
import { InMemoryVectorSearch } from "./adapters/inmemory/vector";
import {
  SupabaseSpeechesRepo,
  SupabaseHighlightsRepo,
  SupabaseSnsRepo,
} from "./adapters/supabase/repositories";
import { SupabaseVectorSearch } from "./adapters/supabase/vector";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
  })),
}));

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    embeddings: {
      create: vi.fn(),
    },
  })),
}));

describe("Container (Dependency Injection)", () => {
  beforeEach(() => {
    // Clear any existing container and environment variables
    clearContainer();
    delete process.env.USE_SUPABASE;
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe("getRepos", () => {
    it("should return InMemory repositories by default", () => {
      const repos = getRepos();

      expect(repos.speeches).toBeInstanceOf(InMemorySpeechesRepo);
      expect(repos.highlights).toBeInstanceOf(InMemoryHighlightsRepo);
      expect(repos.sns).toBeInstanceOf(InMemorySnsRepo);
    });

    it("should return Supabase repositories when USE_SUPABASE=true", () => {
      // Set environment variables for Supabase
      process.env.USE_SUPABASE = "true";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

      const repos = getRepos();

      expect(repos.speeches).toBeInstanceOf(SupabaseSpeechesRepo);
      expect(repos.highlights).toBeInstanceOf(SupabaseHighlightsRepo);
      expect(repos.sns).toBeInstanceOf(SupabaseSnsRepo);
    });

    it("should return InMemory repositories when USE_SUPABASE=false", () => {
      process.env.USE_SUPABASE = "false";

      const repos = getRepos();

      expect(repos.speeches).toBeInstanceOf(InMemorySpeechesRepo);
      expect(repos.highlights).toBeInstanceOf(InMemoryHighlightsRepo);
      expect(repos.sns).toBeInstanceOf(InMemorySnsRepo);
    });

    it("should reuse the same container instance", () => {
      const repos1 = getRepos();
      const repos2 = getRepos();

      expect(repos1).toBe(repos2);
    });

    it("should throw error when Supabase environment variables are missing", () => {
      process.env.USE_SUPABASE = "true";
      // Missing SUPABASE_URL and SERVICE_ROLE_KEY

      expect(() => getRepos()).toThrow("Missing required environment variable");
    });
  });

  describe("getVectorSearch", () => {
    it("should return InMemoryVectorSearch by default", () => {
      process.env.OPENAI_API_KEY = "test-key";

      const vectorSearch = getVectorSearch();

      expect(vectorSearch).toBeInstanceOf(InMemoryVectorSearch);
    });

    it("should return SupabaseVectorSearch when USE_SUPABASE=true", () => {
      process.env.USE_SUPABASE = "true";
      process.env.OPENAI_API_KEY = "test-key";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

      const vectorSearch = getVectorSearch();

      expect(vectorSearch).toBeInstanceOf(SupabaseVectorSearch);
    });
  });

  describe("environment variable validation", () => {
    it("should validate OPENAI_API_KEY is required", () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => getVectorSearch()).toThrow(
        "Missing required environment variable: OPENAI_API_KEY"
      );
    });

    it("should validate Supabase environment variables when USE_SUPABASE=true", () => {
      process.env.USE_SUPABASE = "true";
      process.env.OPENAI_API_KEY = "test-key";

      // Missing SUPABASE_URL
      expect(() => getRepos()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );

      // Missing SERVICE_ROLE_KEY
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => getRepos()).toThrow(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
      );
    });
  });
});
