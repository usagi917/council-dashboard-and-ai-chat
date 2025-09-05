import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LoadingSpinner, ErrorState, EmptyState } from "../LoadingSpinner";

describe("Loading and State Components", () => {
  describe("LoadingSpinner", () => {
    it("renders with default props", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      render(<LoadingSpinner message="データを読み込み中..." />);

      expect(screen.getByText("データを読み込み中...")).toBeInTheDocument();
    });

    it("renders with different sizes", () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);

      let spinner = screen.getByRole("status").querySelector("div");
      expect(spinner).toHaveClass("w-4", "h-4");

      rerender(<LoadingSpinner size="lg" />);
      spinner = screen.getByRole("status").querySelector("div");
      expect(spinner).toHaveClass("w-8", "h-8");
    });

    it("applies custom className", () => {
      render(<LoadingSpinner className="custom-class" />);

      const container = screen.getByRole("status");
      expect(container).toHaveClass("custom-class");
    });

    it("has proper accessibility attributes", () => {
      render(<LoadingSpinner message="カスタムメッセージ" />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-live", "polite");
      expect(screen.getByText("読み込み中...")).toHaveClass("sr-only");
    });
  });

  describe("ErrorState", () => {
    it("renders error message without retry button", () => {
      render(
        <ErrorState
          title="エラーが発生しました"
          message="データの読み込みに失敗しました。"
        />
      );

      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
      expect(
        screen.getByText("データの読み込みに失敗しました。")
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders with retry button", () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          title="接続エラー"
          message="サーバーに接続できませんでした。"
          onRetry={onRetry}
          retryLabel="もう一度試す"
        />
      );

      const retryButton = screen.getByText("もう一度試す");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledOnce();
    });

    it("has proper accessibility attributes", () => {
      render(
        <ErrorState
          title="エラー"
          message="問題が発生しました"
          onRetry={vi.fn()}
        />
      );

      const errorContainer = screen.getByRole("alert");
      expect(errorContainer).toHaveAttribute("aria-live", "assertive");

      const retryButton = screen.getByText("再試行");
      expect(retryButton).toHaveAttribute(
        "aria-describedby",
        "retry-description"
      );

      const description = screen.getByText(
        "エラーが発生したため、操作を再実行します"
      );
      expect(description).toHaveClass("sr-only");
    });

    it("applies custom className", () => {
      render(
        <ErrorState
          title="テスト"
          message="メッセージ"
          className="custom-error-class"
        />
      );

      const container = screen.getByRole("alert");
      expect(container).toHaveClass("custom-error-class");
    });

    it("renders error icon", () => {
      render(<ErrorState title="エラー" message="メッセージ" />);

      const icon = screen.getByRole("alert").querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("EmptyState", () => {
    it("renders with default props", () => {
      render(
        <EmptyState
          title="データがありません"
          description="表示するデータがありません。"
        />
      );

      expect(screen.getByText("データがありません")).toBeInTheDocument();
      expect(
        screen.getByText("表示するデータがありません。")
      ).toBeInTheDocument();

      // Default icon should be rendered
      const container = screen.getByText("データがありません").closest("div");
      const icon = container?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with custom icon", () => {
      const customIcon = <div data-testid="custom-icon">カスタムアイコン</div>;

      render(
        <EmptyState
          title="カスタム空状態"
          description="カスタムアイコン付き"
          icon={customIcon}
        />
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("renders with action button", () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="空の状態"
          description="何かを追加してください"
          action={{
            label: "追加する",
            onClick: onAction,
          }}
        />
      );

      const actionButton = screen.getByText("追加する");
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(onAction).toHaveBeenCalledOnce();
    });

    it("applies custom className", () => {
      render(
        <EmptyState
          title="テスト"
          description="説明"
          className="custom-empty-class"
        />
      );

      const container = screen.getByText("テスト").closest("div");
      expect(container).toHaveClass("custom-empty-class");
    });

    it("handles long descriptions properly", () => {
      const longDescription =
        "これは非常に長い説明文で、複数行にわたって表示される可能性があります。適切にレイアウトされることを確認したいと思います。";

      render(
        <EmptyState title="長い説明のテスト" description={longDescription} />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all components have proper focus management", () => {
      const onRetry = vi.fn();
      const onAction = vi.fn();

      const { rerender } = render(
        <ErrorState title="エラー" message="メッセージ" onRetry={onRetry} />
      );

      const errorRetryButton = screen.getByText("再試行");
      expect(errorRetryButton).toHaveClass(
        "focus:outline-none",
        "focus:ring-2"
      );

      rerender(
        <EmptyState
          title="空状態"
          description="説明"
          action={{ label: "アクション", onClick: onAction }}
        />
      );

      const actionButton = screen.getByText("アクション");
      expect(actionButton).toHaveClass("focus:outline-none", "focus:ring-2");
    });

    it("provides proper ARIA roles and labels", () => {
      render(
        <div>
          <LoadingSpinner message="読み込み中" />
          <ErrorState title="エラー" message="問題発生" onRetry={vi.fn()} />
        </div>
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });
  });

  describe("Visual Consistency", () => {
    it("maintains consistent button styling across components", () => {
      const onRetry = vi.fn();
      const onAction = vi.fn();

      render(
        <div>
          <ErrorState title="エラー" message="メッセージ" onRetry={onRetry} />
          <EmptyState
            title="空状態"
            description="説明"
            action={{ label: "アクション", onClick: onAction }}
          />
        </div>
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass(
          "bg-primary-600",
          "text-white",
          "hover:bg-primary-700",
          "transition-colors"
        );
      });
    });

    it("uses consistent spacing and typography", () => {
      render(
        <div>
          <ErrorState title="エラー" message="メッセージ" />
          <EmptyState title="空状態" description="説明" />
        </div>
      );

      const errorTitle = screen.getByText("エラー");
      const emptyStateTitle = screen.getByText("空状態");

      expect(errorTitle).toHaveClass(
        "text-lg",
        "font-semibold",
        "text-secondary-900",
        "mb-2"
      );
      expect(emptyStateTitle).toHaveClass(
        "text-lg",
        "font-semibold",
        "text-secondary-900",
        "mb-2"
      );
    });
  });
});
