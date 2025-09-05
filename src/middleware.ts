import { NextRequest, NextResponse } from "next/server";
import { verifyServerOnlyEnvVarsAtRuntime } from "./security/server-only-validation";

export function middleware(request: NextRequest) {
  // 最初のリクエストでセキュリティ検証を実行
  verifyServerOnlyEnvVarsAtRuntime();

  const response = NextResponse.next();

  // すべてのレスポンスにセキュリティヘッダーを付与
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // API ルートには追加のセキュリティヘッダーを付与
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのリクエストに適用する:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
