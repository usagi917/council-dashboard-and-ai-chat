import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateEnvironmentSecrets,
  validateCIEnvironment,
} from "./env-validation";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env to a clean state without external variables
    process.env = {} as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateEnvironmentSecrets", () => {
    it("should validate all required production secrets", () => {
      process.env.OPENAI_API_KEY = "sk-test123";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon.test.key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "service.role.key";
      process.env.IG_GRAPH_TOKEN_LONG_LIVED = "IGQ123";
      process.env.FB_APP_ID = "123456";
      process.env.FB_APP_CLIENT_TOKEN = "client.token";

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(true);
      expect(result.missingSecrets).toHaveLength(0);
    });

    it("should detect missing OpenAI API key", () => {
      delete process.env.OPENAI_API_KEY;

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(false);
      expect(result.missingSecrets).toContain("OPENAI_API_KEY");
    });

    it("should detect missing Supabase secrets", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(false);
      expect(result.missingSecrets).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(result.missingSecrets).toContain("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("should detect missing Instagram secrets", () => {
      delete process.env.IG_GRAPH_TOKEN_LONG_LIVED;
      delete process.env.FB_APP_ID;

      const result = validateEnvironmentSecrets();
      expect(result.isValid).toBe(false);
      expect(result.missingSecrets).toContain("IG_GRAPH_TOKEN_LONG_LIVED");
      expect(result.missingSecrets).toContain("FB_APP_ID");
    });

    it("should not expose secret values in validation result", () => {
      process.env.OPENAI_API_KEY = "sk-secret123";

      const result = validateEnvironmentSecrets();
      expect(JSON.stringify(result)).not.toContain("sk-secret123");
    });
  });

  describe("validateCIEnvironment", () => {
    it("should validate CI environment has required secrets for GitHub Actions", () => {
      process.env.CI = "true";
      process.env.CODECOV_TOKEN = "codecov-token";
      process.env.GITHUB_TOKEN = "github-token";

      const result = validateCIEnvironment();
      expect(result.isCI).toBe(true);
      expect(result.hasRequiredCISecrets).toBe(true);
      expect(result.missingCISecrets).toHaveLength(0);
    });

    it("should detect missing CI secrets", () => {
      process.env.CI = "true";
      delete process.env.CODECOV_TOKEN;

      const result = validateCIEnvironment();
      expect(result.isCI).toBe(true);
      expect(result.hasRequiredCISecrets).toBe(false);
      expect(result.missingCISecrets).toContain("CODECOV_TOKEN");
    });

    it("should handle non-CI environments", () => {
      delete process.env.CI;

      const result = validateCIEnvironment();
      expect(result.isCI).toBe(false);
      expect(result.hasRequiredCISecrets).toBe(true); // Not required in non-CI
    });

    it("should detect potential secret leakage", () => {
      process.env.CI = "true";
      // This should NOT trigger leakage detection (proper secret env var)
      process.env.TEST_SECRET_KEY = "sk-secret123";

      const result = validateCIEnvironment();
      expect(result.secretLeakageRisk).toBe(false);
    });

    it("should detect secret in non-secret environment variable", () => {
      process.env.CI = "true";
      // This should trigger leakage detection (secret in non-secret env var with realistic length)
      process.env.SOME_CONFIG =
        "sk-accidentallyexposedverylongsecretkeyhere123456789012345678901234567890";

      const result = validateCIEnvironment();
      expect(result.secretLeakageRisk).toBe(true);
    });
  });
});
