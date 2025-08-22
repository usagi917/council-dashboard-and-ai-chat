import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GraphPage from "./page";

// モックデータ
const mockHighlights = [
  { clusterLabel: "教育政策", count: 5, sampleChunkId: 1 },
  { clusterLabel: "インフラ整備", count: 3, sampleChunkId: 2 },
];

const mockSpeechChunks = [
  {
    id: 1,
    speechId: 1,
    idx: 0,
    text: "教育の質向上について話し合いましょう。",
    sourceUrl: "https://example.com/speech1",
  },
  {
    id: 2,
    speechId: 2,
    idx: 0,
    text: "道路整備の重要性について。",
    sourceUrl: "https://example.com/speech2",
  },
];

// モック関数をglobalな位置で設定
const mockGetRepositories = vi.fn();

vi.mock("../../container", () => ({
  getRepositories: mockGetRepositories,
}));

describe("GraphPage", () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockGetRepositories.mockReset();
  });

  it("renders page title and highlights", async () => {
    mockGetRepositories.mockReturnValue({
      highlightsRepo: {
        list: vi.fn().mockResolvedValue(mockHighlights),
      },
      speechesRepo: {
        getChunksByIds: vi.fn().mockResolvedValue(mockSpeechChunks),
      },
    });

    render(await GraphPage());

    expect(screen.getByText("発言分析グラフ")).toBeInTheDocument();
    expect(
      screen.getByText("議会発言をAIで分析・分類し、代表的な発言を確認できます")
    ).toBeInTheDocument();
  });

  it("shows empty state when no highlights", async () => {
    mockGetRepositories.mockReturnValue({
      highlightsRepo: {
        list: vi.fn().mockResolvedValue([]),
      },
      speechesRepo: {
        getChunksByIds: vi.fn().mockResolvedValue([]),
      },
    });

    render(await GraphPage());

    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
  });
});
