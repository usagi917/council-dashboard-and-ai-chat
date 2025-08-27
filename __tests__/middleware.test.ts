import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock the rate limit middleware
vi.mock("../src/middleware/rate-limit-middleware", () => ({
  applyRateLimit: vi.fn(),
}));

describe("Middleware Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should apply rate limiting to API routes", async () => {
    const { applyRateLimit } = await import(
      "../src/middleware/rate-limit-middleware"
    );
    const { middleware } = await import("../middleware");

    (applyRateLimit as any).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/health");

    const response = await middleware(request);

    expect(applyRateLimit).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200); // NextResponse.next()
  });

  it("should not apply rate limiting to non-API routes", async () => {
    const { applyRateLimit } = await import(
      "../src/middleware/rate-limit-middleware"
    );
    const { middleware } = await import("../middleware");

    const request = new NextRequest("http://localhost:3000/");

    const response = await middleware(request);

    expect(applyRateLimit).not.toHaveBeenCalled();
    expect(response.status).toBe(200); // NextResponse.next()
  });

  it("should return 429 response when rate limit exceeded", async () => {
    const { applyRateLimit } = await import(
      "../src/middleware/rate-limit-middleware"
    );
    const { middleware } = await import("../middleware");

    const mockResponse = new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: 60,
      }),
      { status: 429 }
    );

    (applyRateLimit as any).mockResolvedValue(mockResponse);

    const request = new NextRequest("http://localhost:3000/api/health");

    const response = await middleware(request);

    expect(response.status).toBe(429);
  });
});
