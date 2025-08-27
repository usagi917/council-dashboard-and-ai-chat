import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "./src/middleware/rate-limit-middleware";
import { securityMiddleware } from "./src/middleware/security";

export async function middleware(request: NextRequest) {
  // Apply security headers to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Apply security middleware
    const securityResponse = securityMiddleware(request);

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request);

    // If rate limit exceeded, return the 429 response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Return security response if provided, otherwise continue
    if (securityResponse) {
      return securityResponse;
    }
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
