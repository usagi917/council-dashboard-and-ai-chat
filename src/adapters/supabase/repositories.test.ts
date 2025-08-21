import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseSpeechesRepo,
  SupabaseHighlightsRepo,
  SupabaseSnsRepo,
} from "./repositories";
import type { Database } from "./types";

// Mock Supabase client
const createMockSupabaseClient = () => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  range: vi.fn(),
  single: vi.fn(),
  count: vi.fn(),
});

describe("SupabaseSpeechesRepo", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let repo: SupabaseSpeechesRepo;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    repo = new SupabaseSpeechesRepo(mockClient as any);
  });

  describe("list", () => {
    it("should return paginated speeches", async () => {
      const mockSpeechRows = [
        {
          id: 1,
          date: "2024-01-01",
          session: "第1回定例会",
          speaker: "池元勝",
          content: "テスト発言",
          source_url: "https://example.com",
        },
      ];

      const expectedSpeeches = [
        {
          id: 1,
          date: new Date("2024-01-01"),
          session: "第1回定例会",
          speaker: "池元勝",
          content: "テスト発言",
          sourceUrl: "https://example.com",
        },
      ];

      // Mock chained methods
      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi
        .fn()
        .mockReturnValue({ data: mockSpeechRows, error: null });

      mockClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        range: rangeMock,
      });

      // Mock count query
      const countSelectMock = vi.fn().mockReturnValue({
        data: [{ count: 5 }],
        error: null,
      });

      mockClient.from
        .mockReturnValueOnce({
          // First call for data
          select: selectMock,
          order: orderMock,
          range: rangeMock,
        })
        .mockReturnValueOnce({
          // Second call for count
          select: countSelectMock,
        });

      const result = await repo.list(1, 10);

      expect(mockClient.from).toHaveBeenCalledWith("speeches");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(orderMock).toHaveBeenCalledWith("date", { ascending: false });
      expect(rangeMock).toHaveBeenCalledWith(0, 9); // page 1, size 10 -> range 0-9

      expect(result.items).toEqual(expectedSpeeches);
      expect(result.total).toBe(5);
    });

    it("should throw error when database query fails", async () => {
      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const rangeMock = vi.fn().mockReturnValue({
        data: null,
        error: { message: "Database error" },
      });

      mockClient.from.mockReturnValue({
        select: selectMock,
        order: orderMock,
        range: rangeMock,
      });

      await expect(repo.list(1, 10)).rejects.toThrow("Database error");
    });
  });

  describe("getChunksByIds", () => {
    it("should return speech chunks by IDs", async () => {
      const mockChunkRows = [
        {
          id: 1,
          speech_id: 1,
          idx: 0,
          text: "テストチャンク",
          source_url: "https://example.com",
        },
      ];

      const expectedChunks = [
        {
          id: 1,
          speechId: 1,
          idx: 0,
          text: "テストチャンク",
          sourceUrl: "https://example.com",
        },
      ];

      const selectMock = vi.fn().mockReturnThis();
      const inMock = vi
        .fn()
        .mockReturnValue({ data: mockChunkRows, error: null });

      mockClient.from.mockReturnValue({
        select: selectMock,
        in: inMock,
      });

      const result = await repo.getChunksByIds([1, 2, 3]);

      expect(mockClient.from).toHaveBeenCalledWith("speech_chunks");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(inMock).toHaveBeenCalledWith("id", [1, 2, 3]);
      expect(result).toEqual(expectedChunks);
    });

    it("should return empty array when no IDs provided", async () => {
      const result = await repo.getChunksByIds([]);
      expect(result).toEqual([]);
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });
});

describe("SupabaseHighlightsRepo", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let repo: SupabaseHighlightsRepo;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    repo = new SupabaseHighlightsRepo(mockClient as any);
  });

  it("should return highlights list", async () => {
    const mockHighlightRows = [
      {
        cluster_label: "教育政策",
        count: 10,
        sample_chunk_id: 1,
      },
    ];

    const expectedHighlights = [
      {
        clusterLabel: "教育政策",
        count: 10,
        sampleChunkId: 1,
      },
    ];

    const selectMock = vi.fn().mockReturnThis();
    const orderMock = vi
      .fn()
      .mockReturnValue({ data: mockHighlightRows, error: null });

    mockClient.from.mockReturnValue({
      select: selectMock,
      order: orderMock,
    });

    const result = await repo.list();

    expect(mockClient.from).toHaveBeenCalledWith("highlights");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(orderMock).toHaveBeenCalledWith("count", { ascending: false });
    expect(result).toEqual(expectedHighlights);
  });
});

describe("SupabaseSnsRepo", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let repo: SupabaseSnsRepo;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    repo = new SupabaseSnsRepo(mockClient as any);
  });

  it("should return latest SNS posts", async () => {
    const mockPostRows = [
      {
        id: 1,
        platform: "instagram",
        post_date: "2024-01-01T10:00:00Z",
        content: "テスト投稿",
        media_url: "https://example.com/image.jpg",
        post_url: "https://instagram.com/p/abc123",
      },
    ];

    const expectedPosts = [
      {
        id: 1,
        platform: "instagram",
        postDate: new Date("2024-01-01T10:00:00Z"),
        content: "テスト投稿",
        mediaUrl: "https://example.com/image.jpg",
        postUrl: "https://instagram.com/p/abc123",
      },
    ];

    const selectMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi
      .fn()
      .mockReturnValue({ data: mockPostRows, error: null });

    mockClient.from.mockReturnValue({
      select: selectMock,
      order: orderMock,
      limit: limitMock,
    });

    const result = await repo.latest(5);

    expect(mockClient.from).toHaveBeenCalledWith("sns_posts");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(orderMock).toHaveBeenCalledWith("post_date", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(5);
    expect(result).toEqual(expectedPosts);
  });
});
