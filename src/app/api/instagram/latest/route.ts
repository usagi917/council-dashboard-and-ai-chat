import { NextResponse } from "next/server";
import { SnsPost } from "@/domain/types";

interface GraphApiPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink: string;
  timestamp: string;
}

interface GraphApiResponse {
  data: GraphApiPost[];
}

interface OEmbedResponse {
  html: string;
  title?: string;
  author_name?: string;
}

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";
const OEMBED_BASE = "https://graph.facebook.com/v18.0/instagram_oembed";

async function fetchFromGraphApi(
  token: string,
  limit: number = 5
): Promise<SnsPost[]> {
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "timestamp",
  ].join(",");
  const url = `${GRAPH_API_BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${token}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Graph API failed: ${response.status}`);
  }

  const data: GraphApiResponse = await response.json();

  return data.data.map((post) => ({
    id: 0, // Will be set by repository
    platform: "instagram" as const,
    postDate: new Date(post.timestamp),
    content: post.caption || undefined,
    mediaUrl: post.media_url || undefined,
    postUrl: post.permalink,
  }));
}

async function fetchFromOEmbed(
  appId: string,
  clientToken: string,
  postUrls: string[]
): Promise<SnsPost[]> {
  const results: SnsPost[] = [];

  for (const postUrl of postUrls) {
    try {
      const url = `${OEMBED_BASE}?url=${encodeURIComponent(postUrl)}&access_token=${appId}|${clientToken}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        continue; // Skip failed posts
      }

      const data: OEmbedResponse = await response.json();

      results.push({
        id: 0, // Will be set by repository
        platform: "instagram" as const,
        postDate: new Date(), // oEmbed doesn't provide timestamp, use current time
        content: data.title || data.author_name || undefined,
        mediaUrl: undefined, // oEmbed doesn't provide direct media URL
        postUrl: postUrl,
      });
    } catch (error) {
      console.warn("oEmbed fetch failed for URL:", postUrl, error);
      continue;
    }
  }

  return results;
}

function getDefaultPostUrls(limit: number): string[] {
  // For demo/testing purposes, return some example Instagram URLs
  // In real implementation, you might have a list of recent posts or user-specific URLs
  const exampleUrls = [
    "https://www.instagram.com/p/example1/",
    "https://www.instagram.com/p/example2/",
    "https://www.instagram.com/p/example3/",
    "https://www.instagram.com/p/example4/",
    "https://www.instagram.com/p/example5/",
  ];

  return exampleUrls.slice(0, limit);
}

export async function GET(): Promise<NextResponse> {
  try {
    const limit = 5; // Default to 5 posts

    // Try Graph API first (requires Business/Creator account)
    const graphToken = process.env.IG_GRAPH_TOKEN_LONG_LIVED;
    if (graphToken) {
      try {
        console.log("Attempting Graph API fetch...");
        const posts = await fetchFromGraphApi(graphToken, limit);

        return NextResponse.json(posts, {
          headers: {
            "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.warn("Graph API failed, trying oEmbed fallback:", error);
      }
    }

    // Fallback to oEmbed (requires app credentials)
    const appId = process.env.FB_APP_ID;
    const clientToken = process.env.FB_APP_CLIENT_TOKEN;

    if (appId && clientToken) {
      try {
        console.log("Attempting oEmbed fallback...");
        const postUrls = getDefaultPostUrls(limit);

        if (postUrls.length > 0) {
          const posts = await fetchFromOEmbed(appId, clientToken, postUrls);

          return NextResponse.json(posts, {
            headers: {
              "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
              "Content-Type": "application/json",
            },
          });
        }
      } catch (error) {
        console.warn("oEmbed fallback failed:", error);
      }
    }

    // If both methods fail or no credentials available, return empty array
    console.log("No Instagram API credentials available or all methods failed");
    return NextResponse.json([], {
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
