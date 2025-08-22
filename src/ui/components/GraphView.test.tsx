import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GraphView from "./GraphView";

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
    options,
  }: {
    data: { labels: string[]; datasets: Array<{ data: number[] }> };
    options?: any;
  }) => (
    <div
      data-testid="pie-chart"
      onClick={(e) => {
        // Simulate pie chart click
        if (options?.onClick) {
          options.onClick(e, [{ index: 0 }]);
        }
      }}
    >
      <div data-testid="chart-labels">{data.labels.join(",")}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(",")}</div>
    </div>
  ),
}));

const mockHighlights = [
  { clusterLabel: "教育政策", count: 5, sampleChunkId: 1 },
  { clusterLabel: "インフラ整備", count: 3, sampleChunkId: 2 },
];

const mockSampleChunks = [
  {
    id: 1,
    speechId: 1,
    idx: 0,
    text: "教育の質向上について話し合いましょう。学校施設の改善が急務です。",
    sourceUrl: "https://example.com/speech1",
  },
  {
    id: 2,
    speechId: 2,
    idx: 0,
    text: "道路整備の重要性について。市民の安全を第一に考える必要があります。",
    sourceUrl: "https://example.com/speech2",
  },
];

describe("GraphView", () => {
  it("renders pie chart with highlights", () => {
    render(
      <GraphView highlights={mockHighlights} sampleChunks={mockSampleChunks} />
    );

    expect(screen.getByText("教育政策")).toBeInTheDocument();
    expect(screen.getByText("インフラ整備")).toBeInTheDocument();
    expect(screen.getByText("5件")).toBeInTheDocument();
    expect(screen.getByText("3件")).toBeInTheDocument();
  });

  it("shows empty state when no highlights", () => {
    render(<GraphView highlights={[]} sampleChunks={[]} />);

    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
    expect(
      screen.getByText(
        "発言データの解析を完了すると、こちらに実績が表示されます"
      )
    ).toBeInTheDocument();
  });

  it("shows representative speech when cluster is clicked", () => {
    render(
      <GraphView highlights={mockHighlights} sampleChunks={mockSampleChunks} />
    );

    // 教育政策のクラスタをクリック
    const educationCluster = screen.getByTestId("cluster-教育政策");
    fireEvent.click(educationCluster);

    // 代表発言が表示される
    expect(
      screen.getByText(
        "教育の質向上について話し合いましょう。学校施設の改善が急務です。"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("議事録を確認")).toBeInTheDocument();
  });

  it("renders external links with proper attributes", () => {
    render(
      <GraphView highlights={mockHighlights} sampleChunks={mockSampleChunks} />
    );

    // 教育政策のクラスタをクリック
    const educationCluster = screen.getByTestId("cluster-教育政策");
    fireEvent.click(educationCluster);

    const link = screen.getByText("議事録を確認");
    expect(link).toHaveAttribute("href", "https://example.com/speech1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders navigation link back to home", () => {
    render(
      <GraphView highlights={mockHighlights} sampleChunks={mockSampleChunks} />
    );

    const homeLink = screen.getByText("ホームに戻る");
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest("a")).toHaveAttribute("href", "/");
  });
});
