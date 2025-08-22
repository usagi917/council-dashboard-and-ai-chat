import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    logger.info("Health check requested", {
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.apiError("Health check failed", error as Error, {
      method: "GET",
      url: request.url,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
