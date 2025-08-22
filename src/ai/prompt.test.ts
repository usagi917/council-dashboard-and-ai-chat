import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt";
import { SpeechChunk } from "../domain/types";

describe("buildPrompt", () => {
  it('should return "情報がありません" when no chunks provided', () => {
    const result = buildPrompt({
      question: "教育について教えてください",
      chunks: [],
    });

    expect(result.system).toContain("日本語");
    expect(result.system).toContain("引用");
    expect(result.user).toContain("情報がありません");
  });

  it("should build prompt with chunks and require citations", () => {
    const chunks: SpeechChunk[] = [
      {
        id: 1,
        speechId: 1,
        idx: 0,
        text: "教育予算について議論しました。子どもたちの未来のため重要です。",
        sourceUrl: "https://example.com/speech1",
      },
      {
        id: 2,
        speechId: 2,
        idx: 1,
        text: "学校設備の改善が必要です。ICT環境の整備を進めます。",
        sourceUrl: "https://example.com/speech2",
      },
    ];

    const result = buildPrompt({
      question: "教育について教えてください",
      chunks,
    });

    expect(result.system).toContain("日本語");
    expect(result.system).toContain("引用");
    expect(result.system).toContain("source_url");
    expect(result.user).toContain("教育について教えてください");
    expect(result.user).toContain("教育予算について議論しました");
    expect(result.user).toContain("https://example.com/speech1");
    expect(result.user).toContain("学校設備の改善が必要です");
    expect(result.user).toContain("https://example.com/speech2");
  });

  it("should enforce strict citation requirements", () => {
    const chunks: SpeechChunk[] = [
      {
        id: 1,
        speechId: 1,
        idx: 0,
        text: "予算案について話しました。",
        sourceUrl: "https://example.com/budget",
      },
    ];

    const result = buildPrompt({
      question: "予算について",
      chunks,
    });

    expect(result.system).toContain("必ず");
    expect(result.system).toMatch(/引用|出典|source_url/);
    expect(result.system).toContain("情報がありません");
    expect(result.system).toContain(
      "出典URLが含まれていない回答は無効とみなされ"
    );
  });
});
