import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../middleware";

// Mock NextResponse methods
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({
        headers: {
          set: vi.fn(),
        },
      })),
    },
  };
});

describe("middleware", () => {
  const mockResponse = {
    headers: {
      set: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - mocking NextResponse.next
    NextResponse.next.mockReturnValue(mockResponse);
  });

  it("should add security headers to API routes", async () => {
    const request = new NextRequest("http://localhost:3000/api/health");

    middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(mockResponse.headers.set).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff"
    );
    expect(mockResponse.headers.set).toHaveBeenCalledWith(
      "X-Frame-Options",
      "DENY"
    );
    expect(mockResponse.headers.set).toHaveBeenCalledWith(
      "X-XSS-Protection",
      "1; mode=block"
    );
    expect(mockResponse.headers.set).toHaveBeenCalledWith(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );
  });

  it("should add security headers to non-API routes", async () => {
    const request = new NextRequest("http://localhost:3000/");

    middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(mockResponse.headers.set).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff"
    );
  });

  it("should not interfere with static files", async () => {
    const request = new NextRequest(
      "http://localhost:3000/_next/static/css/main.css"
    );

    middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
  });
});
