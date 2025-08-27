import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { securityMiddleware } from "./security";

// Mock NextResponse
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: new Headers(),
      })),
    },
  };
});

describe("Security Middleware", () => {
  it("should add security headers to API routes", () => {
    const mockRequest = new NextRequest("http://localhost:3000/api/health");
    const mockResponse = {
      headers: new Headers(),
    };

    // Mock NextResponse.next to return our mock response
    const nextSpy = vi.mocked(NextResponse.next);
    nextSpy.mockReturnValue(mockResponse as any);

    securityMiddleware(mockRequest);

    expect(nextSpy).toHaveBeenCalled();
    expect(mockResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(mockResponse.headers.get("X-Frame-Options")).toBe("DENY");
    expect(mockResponse.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(mockResponse.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(
      mockResponse.headers.get("Content-Security-Policy-Report-Only")
    ).toContain("default-src 'self'");
  });

  it("should not add security headers to non-API routes", () => {
    const mockRequest = new NextRequest("http://localhost:3000/");
    const mockResponse = {
      headers: new Headers(),
    };

    const nextSpy = vi.mocked(NextResponse.next);
    nextSpy.mockReturnValue(mockResponse as any);

    const result = securityMiddleware(mockRequest);

    // Should return undefined for non-API routes (no middleware applied)
    expect(result).toBeUndefined();
  });

  it("should handle CSP with unsafe-inline for development", () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = "development";

    const mockRequest = new NextRequest("http://localhost:3000/api/test");
    const mockResponse = {
      headers: new Headers(),
    };

    const nextSpy = vi.mocked(NextResponse.next);
    nextSpy.mockReturnValue(mockResponse as any);

    securityMiddleware(mockRequest);

    const cspHeader = mockResponse.headers.get(
      "Content-Security-Policy-Report-Only"
    );
    expect(cspHeader).toContain("'unsafe-inline'");

    // Restore original env
    (process.env as any).NODE_ENV = originalEnv;
  });
});
