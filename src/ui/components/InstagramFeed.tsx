"use client";

import { useState } from "react";
import type { SnsPost } from "@/domain/types";

interface InstagramFeedProps {
  posts: SnsPost[] | null;
}

export function InstagramFeed({ posts }: InstagramFeedProps) {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
    // Force a page refresh to retry the Instagram API call
    window.location.reload();
  };

  if (posts === null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Instagram投稿を読み込めませんでした
          </h3>
          <p className="text-gray-600 mb-4">
            ネットワークエラーまたはAPI制限により投稿を取得できませんでした。
          </p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Instagram投稿を取得中...
          </h3>
          <p className="text-gray-600">
            最新の投稿は準備中です。しばらくお待ちください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <InstagramCard key={post.id} post={post} />
      ))}
    </div>
  );
}

interface InstagramCardProps {
  post: SnsPost;
}

function InstagramCard({ post }: InstagramCardProps) {
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}分前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else if (diffInDays < 7) {
      return `${diffInDays}日前`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const truncateContent = (
    content: string,
    maxLength: number = 100
  ): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.mediaUrl && (
        <div className="aspect-square bg-gray-100">
          <img
            src={post.mediaUrl}
            alt={post.content || "Instagram投稿"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-4">
        {post.content && (
          <p className="text-gray-800 text-sm mb-3 leading-relaxed">
            {truncateContent(post.content)}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <time dateTime={post.postDate.toISOString()}>
            {formatRelativeTime(post.postDate)}
          </time>

          <a
            href={post.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Instagram で見る
          </a>
        </div>
      </div>
    </div>
  );
}
