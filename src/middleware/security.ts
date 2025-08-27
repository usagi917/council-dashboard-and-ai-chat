import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware that adds security headers to API routes
 */
export function securityMiddleware(request: NextRequest): Response | undefined {
  // Only apply security headers to API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return undefined;
  }

  const response = NextResponse.next();

  // Set security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (report-only mode for now)
  const isDevelopment = process.env.NODE_ENV === "development";

  let cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // In development, allow unsafe-inline for style-src to support hot reloading
  if (isDevelopment) {
    cspDirectives = cspDirectives.map((directive) => {
      if (directive.startsWith("style-src")) {
        return "style-src 'self' 'unsafe-inline'";
      }
      if (directive.startsWith("script-src")) {
        return "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
      }
      return directive;
    });
  }

  const csp = cspDirectives.join("; ");
  response.headers.set("Content-Security-Policy-Report-Only", csp);

  return response;
}
