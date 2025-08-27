import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "./src/middleware/rate-limit-middleware";

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResponse = await applyRateLimit(request);

    // If rate limit exceeded, return the 429 response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
