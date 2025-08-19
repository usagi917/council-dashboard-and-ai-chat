import { NextRequest, NextResponse } from "next/server";
import { getRepos } from "../../../container";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate parameters
    const pageParam = searchParams.get("page") || "1";
    const sizeParam = searchParams.get("size") || "10";

    const page = parseInt(pageParam, 10);
    const size = parseInt(sizeParam, 10);

    // Validation
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "page must be a positive integer" },
        { status: 400 }
      );
    }

    if (isNaN(size) || size < 1 || size > 100) {
      return NextResponse.json(
        { error: "size must be a positive integer between 1 and 100" },
        { status: 400 }
      );
    }

    // Get data from repository
    const { speeches } = getRepos();
    const result = await speeches.list(page, size);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/speeches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
