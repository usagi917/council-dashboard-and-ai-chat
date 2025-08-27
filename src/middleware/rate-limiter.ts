import { NextRequest } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  cache: CacheInterface;
}

export interface CacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    try {
      const clientIp = this.extractClientIp(request);
      const key = `rate_limit:${clientIp}`;
      const now = Date.now();

      // Get current rate limit data
      const existingData = (await this.config.cache.get(
        key
      )) as RateLimitData | null;

      // If no existing data or window has expired, start fresh
      if (!existingData || now >= existingData.resetTime) {
        const resetTime = now + this.config.windowMs;
        const newData: RateLimitData = {
          count: 1,
          resetTime,
        };

        await this.config.cache.set(
          key,
          newData,
          Math.ceil(this.config.windowMs / 1000)
        );

        return {
          allowed: true,
          remainingRequests: this.config.maxRequests - 1,
          resetTime,
        };
      }

      // Check if limit exceeded
      if (existingData.count >= this.config.maxRequests) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: existingData.resetTime,
        };
      }

      // Increment count
      existingData.count += 1;
      const ttlSeconds = Math.ceil((existingData.resetTime - now) / 1000);
      await this.config.cache.set(key, existingData, ttlSeconds);

      return {
        allowed: true,
        remainingRequests: this.config.maxRequests - existingData.count,
        resetTime: existingData.resetTime,
      };
    } catch (error) {
      // Log error but allow request to proceed
      console.error("Rate limiter error:", error);
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests - 1,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }

  private extractClientIp(request: NextRequest): string {
    // Try various headers in order of preference
    const headers = [
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
      "cf-connecting-ip", // Cloudflare
      "true-client-ip", // Cloudflare Enterprise
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
        // Take the first one which should be the original client
        return value.split(",")[0].trim();
      }
    }

    // Fallback to a default IP if none found
    return "unknown";
  }
}

// Factory function for easier testing and configuration
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
