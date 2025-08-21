import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "./client";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("createServerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("should create Supabase client with environment variables", () => {
    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const mockClient = { from: vi.fn() };
    mockCreateClient.mockReturnValue(mockClient as any);

    // Call function
    const client = createServerClient();

    // Verify
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    expect(client).toBe(mockClient);
  });

  it("should throw error when SUPABASE_URL is missing", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => createServerClient()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("should throw error when SERVICE_ROLE_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

    expect(() => createServerClient()).toThrow(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
    );
  });

  it("should throw error when both environment variables are missing", () => {
    expect(() => createServerClient()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });
});
