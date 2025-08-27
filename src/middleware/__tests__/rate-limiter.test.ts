import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { createRateLimiter, RateLimitResult } from "../rate-limiter";

// Mock Redis/Cache for testing
const mockCache = new Map<string, { count: number; resetTime: number }>();

const mockCacheImplementation = {
  async get(key: string) {
    return mockCache.get(key) || null;
  },
  async set(key: string, value: any, ttlSeconds: number) {
    mockCache.set(key, value);
    // In real implementation, TTL would be handled by Redis/cache system
    setTimeout(() => mockCache.delete(key), ttlSeconds * 1000);
  },
  async delete(key: string) {
    mockCache.delete(key);
  },
};

describe("RateLimiter", () => {
  beforeEach(() => {
    mockCache.clear();
    vi.clearAllMocks();
  });

  describe("createRateLimiter", () => {
    it("should allow requests within limit", async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 10,
        cache: mockCacheImplementation,
      });

      const mockReq = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      const result = await rateLimiter.checkLimit(mockReq);

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(9);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it("should block requests exceeding limit", async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        cache: mockCacheImplementation,
      });

      const mockReq = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      // Make 2 requests (within limit)
      await rateLimiter.checkLimit(mockReq);
      const secondResult = await rateLimiter.checkLimit(mockReq);

      expect(secondResult.allowed).toBe(true);
      expect(secondResult.remainingRequests).toBe(0);

      // Third request should be blocked
      const thirdResult = await rateLimiter.checkLimit(mockReq);
      expect(thirdResult.allowed).toBe(false);
      expect(thirdResult.remainingRequests).toBe(0);
    });

    it("should extract IP from various headers", async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        cache: mockCacheImplementation,
      });

      // Test x-forwarded-for
      const req1 = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      // Test x-real-ip
      const req2 = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-real-ip": "192.168.1.2" },
      });

      // Test x-client-ip
      const req3 = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-client-ip": "192.168.1.3" },
      });

      const result1 = await rateLimiter.checkLimit(req1);
      const result2 = await rateLimiter.checkLimit(req2);
      const result3 = await rateLimiter.checkLimit(req3);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it("should handle missing IP address gracefully", async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        cache: mockCacheImplementation,
      });

      const mockReq = new NextRequest("http://localhost:3000/api/health");

      const result = await rateLimiter.checkLimit(mockReq);

      expect(result.allowed).toBe(true); // Should default to allowing unknown IPs
    });

    it("should reset count after window expires", async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 100, // 100ms for quick test
        maxRequests: 1,
        cache: mockCacheImplementation,
      });

      const mockReq = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      // First request should succeed
      const result1 = await rateLimiter.checkLimit(mockReq);
      expect(result1.allowed).toBe(true);

      // Second request should be blocked
      const result2 = await rateLimiter.checkLimit(mockReq);
      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Third request should succeed (new window)
      const result3 = await rateLimiter.checkLimit(mockReq);
      expect(result3.allowed).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle cache errors gracefully", async () => {
      const mockFailingCache = {
        async get() {
          throw new Error("Cache error");
        },
        async set() {
          throw new Error("Cache error");
        },
        async delete() {
          throw new Error("Cache error");
        },
      };

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        cache: mockFailingCache,
      });

      const mockReq = new NextRequest("http://localhost:3000/api/health", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      // Should not throw and should allow request when cache fails
      const result = await rateLimiter.checkLimit(mockReq);
      expect(result.allowed).toBe(true);
    });
  });
});
