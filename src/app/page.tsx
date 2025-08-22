import { getRepos } from "../container";
import HighlightPie from "../ui/components/HighlightPie";
import { Chat } from "../ui/components/Chat";
import { InstagramFeed } from "../ui/components/InstagramFeed";
import type { SnsPost } from "@/domain/types";

async function getHighlights() {
  const { highlights } = getRepos();
  return highlights.list();
}

async function getInstagramPosts(): Promise<SnsPost[] | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/instagram/latest`,
      {
        cache: "no-store", // Always fetch fresh data for initial load
      }
    );

    if (!response.ok) {
      console.warn("Instagram API failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return null;
  }
}

export default async function Home() {
  const highlights = await getHighlights();
  const instagramPosts = await getInstagramPosts();

  return (
    <main className="min-h-screen bg-gradient-to-br from-system-background via-system-background-secondary to-apple-gray-100 font-apple">
      {/* Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-apple-blue/10 via-apple-indigo/5 to-apple-purple/10"></div>

        {/* Header */}
        <header className="relative z-10 backdrop-blur-apple bg-white/80 border-b border-white/20 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-title-2 font-semibold text-apple-gray-900 tracking-tight">
                白山市政ダッシュボード
              </h1>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-caption text-apple-gray-500">
                  <div className="w-2 h-2 bg-apple-green rounded-full animate-pulse"></div>
                  <span>リアルタイム更新中</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-12">
          {/* Welcome Section */}
          <div className="mb-16 text-center animate-fade-in">
            <h2 className="text-large-title sm:text-6xl font-light text-apple-gray-900 mb-4 tracking-tight">
              池元勝市議の
              <span className="bg-gradient-to-r from-apple-blue to-apple-indigo bg-clip-text text-transparent font-medium">
                政治活動
              </span>
            </h2>
            <p className="text-title-3 text-apple-gray-600 max-w-2xl mx-auto leading-relaxed">
              透明性のある政治活動を通じて、市民の皆様により良い白山市をお届けします
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            {/* Highlights Section - Takes more space */}
            <div
              className="lg:col-span-7 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <HighlightPie highlights={highlights} />
            </div>

            {/* SNS Section - Smaller space */}
            <div
              className="lg:col-span-5 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg p-8 shadow-apple-card h-full">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-apple-pink to-apple-orange rounded-apple-sm mr-4 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Instagram"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <h3 className="text-headline text-apple-gray-900">SNS投稿</h3>
                </div>

                <InstagramFeed posts={instagramPosts} />
              </div>
            </div>
          </div>

          {/* AI Chat Section */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Chat />
          </div>
        </div>
      </div>
    </main>
  );
}
