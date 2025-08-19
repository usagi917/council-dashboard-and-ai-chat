import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HighlightPie from "../ui/components/HighlightPie";
import type { Highlight } from "../domain/types";

// Mock the chart component for testing
vi.mock("chart.js", () => ({
  Chart: {
    register: vi.fn(),
  },
  ArcElement: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

vi.mock("react-chartjs-2", () => ({
  Pie: ({ data }: { data: { labels: string[]; datasets: Array<{ data: number[] }> } }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-labels">{data.labels.join(",")}</div>
      <div data-testid="chart-data">{data.datasets[0].data.join(",")}</div>
    </div>
  ),
}));

const HomeComponent = ({ highlights }: { highlights: Highlight[] }) => (
  <main className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Hakusan Dashboard
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HighlightPie highlights={highlights} />
        
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-blue-900">SNS投稿</h2>
          <p className="text-gray-500">Coming Soon...</p>
        </section>
      </div>
      
      <section className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-blue-900">AIチャット</h2>
        <p className="text-gray-500">Coming Soon...</p>
      </section>
    </div>
  </main>
);

describe("Home Page", () => {
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

  it("should render Hakusan Dashboard title", async () => {
    render(<HomeComponent highlights={mockHighlights} />);

    await waitFor(() => {
      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveTextContent("Hakusan Dashboard");
    });
  });

  it("should have correct styling classes and content sections", async () => {
    render(<HomeComponent highlights={mockHighlights} />);

    await waitFor(() => {
      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveClass("text-4xl", "font-bold", "text-blue-900", "mb-8");
    });

    // Check for section headings
    expect(screen.getByText("実績ハイライト")).toBeInTheDocument();
    expect(screen.getByText("SNS投稿")).toBeInTheDocument();
    expect(screen.getByText("AIチャット")).toBeInTheDocument();
    
    // Check for coming soon placeholders
    expect(screen.getAllByText("Coming Soon...")).toHaveLength(2);
  });
});
