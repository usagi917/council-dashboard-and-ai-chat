import { describe, it, expect } from "vitest";

describe("Server-only API Keys Security", () => {
  it("OPENAI_API_KEY がクライアントに公開されないこと", () => {
    // クライアント環境をシミュレート
    const originalWindow = global.window;
    // @ts-expect-error - テスト用に window をモック
    global.window = { location: { href: "http://localhost:3000" } };

    // OPENAI_API_KEY がクライアント側で参照できないことを確認
    const clientSideEnv = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    expect(clientSideEnv).toBeUndefined();

    // 後片付け
    global.window = originalWindow;
  });

  it("SUPABASE_SERVICE_ROLE_KEY がクライアントに公開されないこと", () => {
    // サービスロールキーがクライアント側で参照できないことを確認
    const clientSideServiceKey =
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    expect(clientSideServiceKey).toBeUndefined();
  });

  it("Instagram 関連のトークンがクライアントに公開されないこと", () => {
    const clientSideIgToken = process.env.NEXT_PUBLIC_IG_GRAPH_TOKEN_LONG_LIVED;
    const clientSideFbToken = process.env.NEXT_PUBLIC_FB_APP_CLIENT_TOKEN;

    expect(clientSideIgToken).toBeUndefined();
    expect(clientSideFbToken).toBeUndefined();
  });

  it("サーバー専用検証ユーティリティが存在すること", async () => {
    const { validateServerOnlyEnvVars } = await import(
      "../server-only-validation"
    );
    expect(typeof validateServerOnlyEnvVars).toBe("function");
  });

  it("センシティブなキーが誤って公開された場合に検出できること", async () => {
    // 露出したキーをモック
    const originalEnv = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = "sk-test123";

    const { validateServerOnlyEnvVars } = await import(
      "../server-only-validation"
    );
    const result = validateServerOnlyEnvVars();

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      "OPENAI_API_KEY exposed as NEXT_PUBLIC_OPENAI_API_KEY"
    );

    // 後片付け
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = originalEnv;
    }
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY は許可されること", async () => {
    // クライアント公開が許可されている Supabase anon key をモック
    const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMzI2MjQwMCwiZXhwIjoxOTAzMjYyNDAwfQ.example";

    const { validateServerOnlyEnvVars } = await import(
      "../server-only-validation"
    );
    const result = validateServerOnlyEnvVars();

    // anon key はクライアント公開前提なので検出されないこと
    expect(result.isValid).toBe(true);
    expect(result.violations).not.toContain(
      expect.stringContaining("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );

    // 後片付け
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv;
    }
  });
});
