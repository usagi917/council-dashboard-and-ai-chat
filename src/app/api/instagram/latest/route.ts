import { NextResponse } from "next/server";
import { getInstagramPosts } from "@/lib/instagram";

export async function GET(): Promise<NextResponse> {
  try {
    const posts = await getInstagramPosts(5);

    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Instagram API route error:", error);

    // Return empty array instead of error to gracefully handle failures
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    });
  }
}
