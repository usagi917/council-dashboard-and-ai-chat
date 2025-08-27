import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InstagramFeed } from "../InstagramFeed";
import HighlightPie from "../HighlightPie";
import type { SnsPost, Highlight } from "@/domain/types";

// Mock window.location.reload
Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

describe("Error Handling and UI States", () => {
  describe("InstagramFeed Error Handling", () => {
    it("shows error state with retry button when posts is null", () => {
      render(<InstagramFeed posts={null} />);

      expect(
        screen.getByText("Instagram投稿を読み込めませんでした")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "ネットワークエラーまたはAPI制限により投稿を取得できませんでした。"
        )
      ).toBeInTheDocument();

      const retryButton = screen.getByText("再読み込み");
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveClass(
        "bg-blue-600",
        "hover:bg-blue-700",
        "transition-colors"
      );
    });

    it("shows loading state when posts array is empty", () => {
      render(<InstagramFeed posts={[]} />);

      expect(screen.getByText("Instagram投稿を取得中...")).toBeInTheDocument();
      expect(
        screen.getByText("最新の投稿は準備中です。しばらくお待ちください。")
      ).toBeInTheDocument();
    });

    it("calls window.location.reload when retry button is clicked", () => {
      render(<InstagramFeed posts={null} />);

      const retryButton = screen.getByText("再読み込み");
      fireEvent.click(retryButton);

      expect(window.location.reload).toHaveBeenCalled();
    });

    it("renders posts successfully when data is available", () => {
      const mockPosts: SnsPost[] = [
        {
          id: 1,
          platform: "instagram",
          postDate: new Date("2023-01-01"),
          content: "テスト投稿",
          mediaUrl: "https://example.com/image.jpg",
          postUrl: "https://instagram.com/p/test",
        },
      ];

      render(<InstagramFeed posts={mockPosts} />);

      expect(screen.getByText("テスト投稿")).toBeInTheDocument();
      expect(screen.getByText("Instagram で見る")).toBeInTheDocument();
    });

    it("handles image loading errors gracefully", () => {
      const mockPosts: SnsPost[] = [
        {
          id: 1,
          platform: "instagram",
          postDate: new Date("2023-01-01"),
          content: "テスト投稿",
          mediaUrl: "https://example.com/invalid-image.jpg",
          postUrl: "https://instagram.com/p/test",
        },
      ];

      render(<InstagramFeed posts={mockPosts} />);

      const image = screen.getByAltText("テスト投稿");

      // Simulate image loading error
      fireEvent.error(image);

      // Image should be hidden on error
      expect(image).toHaveStyle({ display: "none" });
    });

    it("handles posts without content gracefully", () => {
      const mockPosts: SnsPost[] = [
        {
          id: 1,
          platform: "instagram",
          postDate: new Date("2023-01-01"),
          content: "",
          mediaUrl: "https://example.com/image.jpg",
          postUrl: "https://instagram.com/p/test",
        },
      ];

      render(<InstagramFeed posts={mockPosts} />);

      // Should still render the card with image and link
      expect(screen.getByText("Instagram で見る")).toBeInTheDocument();
      expect(screen.getByAltText("Instagram投稿")).toBeInTheDocument();
    });

    it("handles posts without media gracefully", () => {
      const mockPosts: SnsPost[] = [
        {
          id: 1,
          platform: "instagram",
          postDate: new Date("2023-01-01"),
          content: "テスト投稿のみ",
          mediaUrl: "",
          postUrl: "https://instagram.com/p/test",
        },
      ];

      render(<InstagramFeed posts={mockPosts} />);

      // Should render content and link, but no image
      expect(screen.getByText("テスト投稿のみ")).toBeInTheDocument();
      expect(screen.getByText("Instagram で見る")).toBeInTheDocument();
      expect(screen.queryByAltText(/Instagram投稿/)).not.toBeInTheDocument();
    });
  });

  describe("HighlightPie Empty States", () => {
    it("shows empty state when no highlights are provided", () => {
      render(<HighlightPie highlights={[]} />);

      expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
      expect(
        screen.getByText(
          "発言データの解析を完了すると、こちらに実績が表示されます"
        )
      ).toBeInTheDocument();

      // Should have proper styling for empty state
      expect(screen.getByText("実績ハイライト")).toBeInTheDocument();
    });

    it("provides accessibility features in empty state", () => {
      render(<HighlightPie highlights={[]} />);

      // Should have proper aria labels in empty state
      const chartIcon = screen.getByLabelText("チャート");
      expect(chartIcon).toBeInTheDocument();
    });

    it("handles empty state accessibility", () => {
      render(<HighlightPie highlights={[]} />);

      // Empty state should have proper aria label
      const emptyStateIcon = screen.getByLabelText("空の状態");
      expect(emptyStateIcon).toBeInTheDocument();
    });
  });

  describe("Consistent Error Styling", () => {
    it("maintains consistent button styling across components", () => {
      render(<InstagramFeed posts={null} />);

      const retryButton = screen.getByText("再読み込み");
      expect(retryButton).toHaveClass("bg-blue-600");
      expect(retryButton).toHaveClass("text-white");
      expect(retryButton).toHaveClass("transition-colors");
    });

    it("provides consistent empty state messaging", () => {
      render(<HighlightPie highlights={[]} />);

      const emptyMessage = screen.getByText("データが見つかりません");
      expect(emptyMessage).toBeInTheDocument();

      const helpText = screen.getByText(
        "発言データの解析を完了すると、こちらに実績が表示されます"
      );
      expect(helpText).toBeInTheDocument();
    });
  });

  describe("User Experience", () => {
    it("provides helpful context in error messages", () => {
      render(<InstagramFeed posts={null} />);

      // Error message should explain the issue and offer a solution
      expect(
        screen.getByText("Instagram投稿を読み込めませんでした")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "ネットワークエラーまたはAPI制限により投稿を取得できませんでした。"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("再読み込み")).toBeInTheDocument();
    });

    it("provides clear loading indicators", () => {
      render(<InstagramFeed posts={[]} />);

      // Loading state should be clear and reassuring
      expect(screen.getByText("Instagram投稿を取得中...")).toBeInTheDocument();
      expect(
        screen.getByText("最新の投稿は準備中です。しばらくお待ちください。")
      ).toBeInTheDocument();
    });

    it("provides context for empty data states", () => {
      render(<HighlightPie highlights={[]} />);

      // Empty state should explain why data is missing and what will happen next
      const contextText = screen.getByText(
        "発言データの解析を完了すると、こちらに実績が表示されます"
      );
      expect(contextText).toBeInTheDocument();
    });
  });
});
