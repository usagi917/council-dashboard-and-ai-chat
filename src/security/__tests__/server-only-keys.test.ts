import { describe, it, expect } from "vitest";

describe("Server-only API Keys Security", () => {
  it("should ensure OPENAI_API_KEY is not exposed to client-side", () => {
    // Simulate client-side environment
    const originalWindow = global.window;
    // @ts-expect-error - Mocking global.window for test
    global.window = { location: { href: "http://localhost:3000" } };

    // Check that OPENAI_API_KEY is not accessible on client-side
    const clientSideEnv = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    expect(clientSideEnv).toBeUndefined();

    // Restore
    global.window = originalWindow;
  });

  it("should ensure SUPABASE_SERVICE_ROLE_KEY is not exposed to client-side", () => {
    // Check that service role key is not accessible on client-side
    const clientSideServiceKey =
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    expect(clientSideServiceKey).toBeUndefined();
  });

  it("should ensure Instagram tokens are not exposed to client-side", () => {
    const clientSideIgToken = process.env.NEXT_PUBLIC_IG_GRAPH_TOKEN_LONG_LIVED;
    const clientSideFbToken = process.env.NEXT_PUBLIC_FB_APP_CLIENT_TOKEN;

    expect(clientSideIgToken).toBeUndefined();
    expect(clientSideFbToken).toBeUndefined();
  });

  it("should have server-only validation utility", async () => {
    // This should fail initially - we need to implement this utility
    const { validateServerOnlyKeys } = await import(
      "../server-only-validation"
    );
    expect(typeof validateServerOnlyKeys).toBe("function");
  });

  it("should detect if sensitive keys are accidentally exposed", async () => {
    // Mock environment with accidentally exposed key
    const originalEnv = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = "sk-test123";

    const { validateServerOnlyKeys } = await import(
      "../server-only-validation"
    );
    const result = validateServerOnlyKeys();

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      "OPENAI_API_KEY exposed as NEXT_PUBLIC_OPENAI_API_KEY"
    );

    // Restore
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = originalEnv;
    }
  });

  it("should allow NEXT_PUBLIC_SUPABASE_ANON_KEY (client-exposed by design)", async () => {
    // Mock environment with Supabase anon key (which is meant to be client-exposed)
    const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMzI2MjQwMCwiZXhwIjoxOTAzMjYyNDAwfQ.example";

    const { validateServerOnlyKeys } = await import(
      "../server-only-validation"
    );
    const result = validateServerOnlyKeys();

    // Should be valid because anon key is supposed to be client-exposed
    expect(result.isValid).toBe(true);
    expect(result.violations).not.toContain(
      expect.stringContaining("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );

    // Restore
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv;
    }
  });
});
