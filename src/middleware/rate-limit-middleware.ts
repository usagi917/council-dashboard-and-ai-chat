import { NextRequest, NextResponse } from "next/server";
import {
  createRateLimiter,
  CacheInterface,
  RateLimitResult,
} from "./rate-limiter";

// Simple in-memory cache for development/testing
// In production, this should be replaced with Redis or similar
class MemoryCache implements CacheInterface {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    globalCache.cleanup();
  },
  5 * 60 * 1000
);

// Default rate limiter configuration
const defaultRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute per IP
  cache: globalCache,
});

export async function applyRateLimit(
  request: NextRequest,
  rateLimiter = defaultRateLimiter
): Promise<NextResponse | null> {
  try {
    const result: RateLimitResult = await rateLimiter.checkLimit(request);

    if (!result.allowed) {
      // Create 429 Too Many Requests response
      const retryAfterSeconds = Math.ceil(
        (result.resetTime - Date.now()) / 1000
      );

      const response = NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: retryAfterSeconds,
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", "60");
      response.headers.set(
        "X-RateLimit-Remaining",
        result.remainingRequests.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(result.resetTime / 1000).toString()
      );
      response.headers.set("Retry-After", retryAfterSeconds.toString());

      return response;
    }

    // Request allowed - return null to continue processing
    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Allow request to proceed on error
    return null;
  }
}

// Export cache for testing
export { globalCache };
