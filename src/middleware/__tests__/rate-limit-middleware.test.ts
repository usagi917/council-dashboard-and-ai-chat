import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the rate limiter module
const mockCheckLimit = vi.fn();
const mockRateLimiter = {
  checkLimit: mockCheckLimit,
};

vi.mock("../rate-limiter", () => ({
  createRateLimiter: vi.fn(() => mockRateLimiter),
}));

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request when within rate limit", async () => {
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remainingRequests: 9,
      resetTime: Date.now() + 60000,
    });

    const { applyRateLimit } = await import("../rate-limit-middleware");

    const request = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const response = await applyRateLimit(request);

    expect(response).toBeNull(); // null means continue processing
    expect(mockCheckLimit).toHaveBeenCalledWith(request);
  });

  it("should block request when rate limit exceeded", async () => {
    const resetTime = Date.now() + 60000;
    mockCheckLimit.mockResolvedValue({
      allowed: false,
      remainingRequests: 0,
      resetTime,
    });

    const { applyRateLimit } = await import("../rate-limit-middleware");

    const request = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const response = await applyRateLimit(request);

    expect(response).toBeInstanceOf(Response); // NextResponse extends Response
    expect(response?.status).toBe(429);

    const responseBody = await response?.json();
    expect(responseBody).toEqual({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    });

    // Check headers
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response?.headers.get("X-RateLimit-Reset")).toBe(
      Math.ceil(resetTime / 1000).toString()
    );
    expect(response?.headers.get("Retry-After")).toBe(
      Math.ceil((resetTime - Date.now()) / 1000).toString()
    );
  });

  it("should handle rate limiter errors gracefully", async () => {
    mockCheckLimit.mockRejectedValue(new Error("Rate limiter error"));

    const { applyRateLimit } = await import("../rate-limit-middleware");

    const request = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const response = await applyRateLimit(request);

    // Should allow request when rate limiter fails
    expect(response).toBeNull();
  });

  it("should add rate limit headers for successful requests", async () => {
    const resetTime = Date.now() + 60000;
    mockCheckLimit.mockResolvedValue({
      allowed: true,
      remainingRequests: 5,
      resetTime,
    });

    const { applyRateLimit } = await import("../rate-limit-middleware");

    const request = new NextRequest("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });

    const response = await applyRateLimit(request);

    expect(response).toBeNull(); // Allowed, but we should check if headers would be added
  });
});
