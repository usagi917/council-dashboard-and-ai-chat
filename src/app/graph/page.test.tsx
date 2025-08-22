import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Chart.js to avoid canvas issues in tests
vi.mock("chart.js", () => ({
  Chart: {
    register: vi.fn(),
  },
  ArcElement: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

vi.mock("react-chartjs-2", () => ({
  Pie: ({
    data,
  }: {
    data: { labels: string[]; datasets: Array<{ data: number[] }> };
  }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-labels">{data.labels.join(",")}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(",")}</div>
    </div>
  ),
}));

// Mock container
vi.mock("../../container", () => ({
  getRepositories: vi.fn(),
}));

import GraphPage from "./page";
import { getRepositories } from "../../container";

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

const mockGetRepositories = vi.mocked(getRepositories);

describe("GraphPage", () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockGetRepositories.mockReset();
  });

  it("renders page title and highlights", async () => {
    mockGetRepositories.mockReturnValue({
      highlightsRepo: {
        list: vi.fn().mockResolvedValue(mockHighlights),
        upsert: vi.fn(),
        clear: vi.fn(),
      },
      speechesRepo: {
        list: vi.fn(),
        getChunksByIds: vi.fn().mockResolvedValue(mockSpeechChunks),
        getAllChunks: vi.fn(),
      },
      snsRepo: {
        latest: vi.fn(),
      },
      embeddingsRepo: {
        getAllEmbeddings: vi.fn(),
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
        upsert: vi.fn(),
        clear: vi.fn(),
      },
      speechesRepo: {
        list: vi.fn(),
        getChunksByIds: vi.fn().mockResolvedValue([]),
        getAllChunks: vi.fn(),
      },
      snsRepo: {
        latest: vi.fn(),
      },
      embeddingsRepo: {
        getAllEmbeddings: vi.fn(),
      },
    });

    render(await GraphPage());

    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
  });
});
