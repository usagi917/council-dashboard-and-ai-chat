import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstagramFeed } from "@/ui/components/InstagramFeed";
import type { SnsPost } from "@/domain/types";

describe("InstagramFeed", () => {
  const mockPosts: SnsPost[] = [
    {
      id: 1,
      platform: "instagram",
      postDate: new Date("2023-01-01T10:00:00Z"),
      content: "Test post 1",
      mediaUrl: "https://example.com/image1.jpg",
      postUrl: "https://instagram.com/p/1",
    },
    {
      id: 2,
      platform: "instagram",
      postDate: new Date("2023-01-02T10:00:00Z"),
      content: "Test post 2",
      mediaUrl: "https://example.com/video2.mp4",
      postUrl: "https://instagram.com/p/2",
    },
  ];

  it("should render Instagram posts as cards", () => {
    render(<InstagramFeed posts={mockPosts} />);

    expect(screen.getByText("Test post 1")).toBeInTheDocument();
    expect(screen.getByText("Test post 2")).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://example.com/image1.jpg");
    expect(images[1]).toHaveAttribute("src", "https://example.com/video2.mp4");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://instagram.com/p/1");
    expect(links[1]).toHaveAttribute("href", "https://instagram.com/p/2");
  });

  it("should show placeholder when no posts are provided", () => {
    render(<InstagramFeed posts={[]} />);

    expect(screen.getByText("Instagram投稿を取得中...")).toBeInTheDocument();
    expect(
      screen.getByText("最新の投稿は準備中です。しばらくお待ちください。")
    ).toBeInTheDocument();
  });

  it("should show error state when posts is null", () => {
    render(<InstagramFeed posts={null} />);

    expect(
      screen.getByText("Instagram投稿を読み込めませんでした")
    ).toBeInTheDocument();
    expect(screen.getByText("再読み込み")).toBeInTheDocument();
  });

  it("should truncate long content", () => {
    const longContentPost: SnsPost = {
      id: 1,
      platform: "instagram",
      postDate: new Date("2023-01-01T10:00:00Z"),
      content:
        "This is a very long post content that should be truncated when displayed in the card view to ensure the UI remains clean and readable.",
      mediaUrl: "https://example.com/image1.jpg",
      postUrl: "https://instagram.com/p/1",
    };

    render(<InstagramFeed posts={[longContentPost]} />);

    const content = screen.getByText(/This is a very long post content/);
    expect(content.textContent).toMatch(/\.\.\./);
  });

  it("should display relative time for posts", () => {
    const recentPost: SnsPost = {
      id: 1,
      platform: "instagram",
      postDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      content: "Recent post",
      mediaUrl: "https://example.com/image1.jpg",
      postUrl: "https://instagram.com/p/1",
    };

    render(<InstagramFeed posts={[recentPost]} />);

    expect(screen.getByText(/時間前/)).toBeInTheDocument();
  });
});
