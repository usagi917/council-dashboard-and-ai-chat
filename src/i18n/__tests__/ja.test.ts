import { describe, it, expect } from "vitest";
import { messages, getMessage } from "../ja";

describe("i18n/ja", () => {
  it("should provide all required error messages", () => {
    expect(messages.errors.dataFetchFailed).toBe("データの取得に失敗しました");
    expect(messages.errors.noInformation).toBe("情報がありません。");
    expect(messages.errors.chatError).toBe("チャットでエラーが発生しました");
    expect(messages.errors.instagramFetchFailed).toBe(
      "Instagram投稿の取得に失敗しました"
    );
    expect(messages.errors.speechesFetchFailed).toBe(
      "発言データの取得に失敗しました"
    );
    expect(messages.errors.highlightsFetchFailed).toBe(
      "ハイライトデータの取得に失敗しました"
    );
  });

  it("should provide loading messages", () => {
    expect(messages.loading.fetchingData).toBe("データを取得中...");
    expect(messages.loading.processing).toBe("処理中...");
    expect(messages.loading.generatingResponse).toBe("回答を生成中...");
  });

  it("should provide action messages", () => {
    expect(messages.actions.retry).toBe("再試行");
    expect(messages.actions.refresh).toBe("更新");
    expect(messages.actions.contact).toBe("お問い合わせ");
  });

  it("should provide empty state messages", () => {
    expect(messages.emptyState.noData).toBe("データがありません");
    expect(messages.emptyState.noResults).toBe("検索結果がありません");
    expect(messages.emptyState.suggestion).toBe(
      "データを更新するか、お問い合わせください"
    );
  });

  describe("getMessage function", () => {
    it("should return message by key path", () => {
      expect(getMessage("errors.noInformation")).toBe("情報がありません。");
      expect(getMessage("loading.fetchingData")).toBe("データを取得中...");
      expect(getMessage("actions.retry")).toBe("再試行");
    });

    it("should return fallback for unknown keys", () => {
      expect(getMessage("unknown.key")).toBe("エラーが発生しました");
    });

    it("should handle nested unknown keys", () => {
      expect(getMessage("errors.unknownError")).toBe("エラーが発生しました");
    });
  });
});
