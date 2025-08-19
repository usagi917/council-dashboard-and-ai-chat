import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt";
import type { SpeechChunk } from "../../domain/types";

describe("buildPrompt", () => {
  const mockChunk1: SpeechChunk = {
    id: 1,
    speechId: 101,
    idx: 0,
    text: "教育予算の拡充について議論しました。",
    sourceUrl: "https://example.com/speech/101",
  };

  const mockChunk2: SpeechChunk = {
    id: 2,
    speechId: 102,
    idx: 1,
    text: "地域の学校環境整備が重要です。",
    sourceUrl: "https://example.com/speech/102",
  };

  it("should return no-info message when chunks are empty", () => {
    const result = buildPrompt({
      question: "教育について教えて",
      chunks: [],
    });

    expect(result.system).toContain("日本語");
    expect(result.system).toContain("引用");
    expect(result.user).toContain("質問: 教育について教えて");
    expect(result.user).toContain("（なし）");
    expect(result.user).toContain("情報がありません。");
  });

  it("should build prompt with chunks and require citations", () => {
    const result = buildPrompt({
      question: "教育政策について",
      chunks: [mockChunk1, mockChunk2],
    });

    expect(result.system).toContain("日本語");
    expect(result.system).toContain("引用");
    expect(result.system).toContain("source_url");
    expect(result.user).toContain("教育政策について");
    expect(result.user).toContain(mockChunk1.text);
    expect(result.user).toContain(mockChunk2.text);
    expect(result.user).toContain(mockChunk1.sourceUrl);
    expect(result.user).toContain(mockChunk2.sourceUrl);
  });

  it("should include strict citation requirements", () => {
    const result = buildPrompt({
      question: "テスト質問",
      chunks: [mockChunk1],
    });

    expect(result.system).toMatch(/必ず.*引用|引用.*必ず/);
  });

  it("should use casual Japanese tone", () => {
    const result = buildPrompt({
      question: "テスト質問",
      chunks: [mockChunk1],
    });

    expect(result.system).toContain("カジュアル");
  });
});
