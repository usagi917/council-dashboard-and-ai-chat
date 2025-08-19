import { describe, it, expect } from "vitest";
import type { SpeechesRepo, HighlightsRepo, SnsRepo } from "../repositories";
import type {
  Speech,
  SpeechChunk,
  Highlight,
  SnsPost,
} from "../../domain/types";

describe("Repository Interfaces", () => {
  it("should define SpeechesRepo interface with correct methods", () => {
    // This test verifies the interface structure exists
    const mockSpeechesRepo: SpeechesRepo = {
      list: async (_page: number, _size: number) => ({
        items: [] as Speech[],
        total: 0,
      }),
      getChunksByIds: async (_ids: number[]) => [] as SpeechChunk[],
    };

    expect(typeof mockSpeechesRepo.list).toBe("function");
    expect(typeof mockSpeechesRepo.getChunksByIds).toBe("function");
  });

  it("should define HighlightsRepo interface with correct methods", () => {
    const mockHighlightsRepo: HighlightsRepo = {
      list: async () => [] as Highlight[],
    };

    expect(typeof mockHighlightsRepo.list).toBe("function");
  });

  it("should define SnsRepo interface with correct methods", () => {
    const mockSnsRepo: SnsRepo = {
      latest: async (_n: number) => [] as SnsPost[],
    };

    expect(typeof mockSnsRepo.latest).toBe("function");
  });

  it("should validate list method returns paginated result", async () => {
    const mockSpeechesRepo: SpeechesRepo = {
      list: async (_page: number, _size: number) => ({
        items: [],
        total: 0,
      }),
      getChunksByIds: async (_ids: number[]) => [],
    };

    const result = await mockSpeechesRepo.list(1, 10);
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });
});
