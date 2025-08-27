import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

describe("Environment Template", () => {
  it("should have .env.example file with all required variables", () => {
    const envExamplePath = join(process.cwd(), ".env.example");

    expect(() => {
      const content = readFileSync(envExamplePath, "utf-8");

      // Check for required variables
      const requiredVars = [
        "NEXT_PUBLIC_SITE_NAME",
        "OPENAI_API_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "IG_GRAPH_TOKEN_LONG_LIVED",
        "FB_APP_ID",
        "FB_APP_CLIENT_TOKEN",
        "USE_SUPABASE",
      ];

      requiredVars.forEach((variable) => {
        expect(content).toContain(variable);
      });

      // Check for helpful comments
      expect(content).toContain("# アプリケーション設定");
      expect(content).toContain("# OpenAI API設定");
      expect(content).toContain("# Supabase設定");
      expect(content).toContain("# Instagram連携設定");
      expect(content).toContain("# 機能フラグ");
    }).not.toThrow();
  });
});
