import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HighlightPie from "../HighlightPie";
import type { Highlight } from "../../../domain/types";

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

describe("HighlightPie", () => {
  const mockHighlights: Highlight[] = [
    {
      clusterLabel: "教育政策",
      count: 15,
      sampleChunkId: 1,
    },
    {
      clusterLabel: "地域福祉",
      count: 12,
      sampleChunkId: 3,
    },
  ];

  it("should render pie chart with highlights data", () => {
    render(<HighlightPie highlights={mockHighlights} />);

    expect(screen.getByText("実績ハイライト")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart-labels")).toHaveTextContent(
      "教育政策,地域福祉"
    );
    expect(screen.getByTestId("chart-data")).toHaveTextContent("15,12");
  });

  it("should show empty state when no highlights", () => {
    render(<HighlightPie highlights={[]} />);

    expect(screen.getByText("実績ハイライト")).toBeInTheDocument();
    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
    expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
  });

  it("should render highlights list", () => {
    render(<HighlightPie highlights={mockHighlights} />);

    mockHighlights.forEach((highlight) => {
      expect(screen.getByText(highlight.clusterLabel)).toBeInTheDocument();
      expect(screen.getByText(`${highlight.count}件`)).toBeInTheDocument();
    });
  });

  it("should render navigation link to graph page", () => {
    render(<HighlightPie highlights={mockHighlights} />);

    const graphLink = screen.getByText("詳細を見る");
    expect(graphLink).toBeInTheDocument();
    expect(graphLink.closest("a")).toHaveAttribute("href", "/graph");
  });
});
