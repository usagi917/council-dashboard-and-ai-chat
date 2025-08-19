import { describe, it, expect } from "vitest";
import type { Speech, SpeechChunk, Highlight, SnsPost } from "../types";

describe("Domain Types", () => {
  it("should create Speech object with correct properties", () => {
    const speech: Speech = {
      id: 1,
      date: new Date("2023-12-01"),
      session: "令和5年12月定例会",
      speaker: "池元勝",
      content: "教育予算の充実について質問いたします。",
      sourceUrl: "https://example.com/speech/1",
    };

    expect(speech.id).toBe(1);
    expect(speech.date).toBeInstanceOf(Date);
    expect(speech.session).toBe("令和5年12月定例会");
    expect(speech.speaker).toBe("池元勝");
    expect(speech.content).toBe("教育予算の充実について質問いたします。");
    expect(speech.sourceUrl).toBe("https://example.com/speech/1");
  });

  it("should create SpeechChunk object with correct properties", () => {
    const chunk: SpeechChunk = {
      id: 1,
      speechId: 1,
      idx: 0,
      text: "教育予算の充実について質問いたします。",
      sourceUrl: "https://example.com/speech/1",
    };

    expect(chunk.id).toBe(1);
    expect(chunk.speechId).toBe(1);
    expect(chunk.idx).toBe(0);
    expect(chunk.text).toBe("教育予算の充実について質問いたします。");
    expect(chunk.sourceUrl).toBe("https://example.com/speech/1");
  });

  it("should create Highlight object with correct properties", () => {
    const highlight: Highlight = {
      clusterLabel: "教育政策",
      count: 15,
      sampleChunkId: 1,
    };

    expect(highlight.clusterLabel).toBe("教育政策");
    expect(highlight.count).toBe(15);
    expect(highlight.sampleChunkId).toBe(1);
  });

  it("should create SnsPost object with correct properties", () => {
    const snsPost: SnsPost = {
      id: 1,
      platform: "instagram",
      postDate: new Date("2023-12-01T10:00:00Z"),
      content: "市民の皆様と意見交換をしました。",
      mediaUrl: "https://example.com/media/1.jpg",
      postUrl: "https://instagram.com/p/abc123",
    };

    expect(snsPost.id).toBe(1);
    expect(snsPost.platform).toBe("instagram");
    expect(snsPost.postDate).toBeInstanceOf(Date);
    expect(snsPost.content).toBe("市民の皆様と意見交換をしました。");
    expect(snsPost.mediaUrl).toBe("https://example.com/media/1.jpg");
    expect(snsPost.postUrl).toBe("https://instagram.com/p/abc123");
  });
});
