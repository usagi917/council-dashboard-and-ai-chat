"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { Highlight } from "../../domain/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface HighlightPieProps {
  highlights: Highlight[];
}

export default function HighlightPie({ highlights }: HighlightPieProps) {
  if (highlights.length === 0) {
    return (
      <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg p-8 shadow-apple-card animate-scale-in">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-apple-blue to-apple-indigo rounded-apple-sm mr-4 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="チャート"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-headline text-apple-gray-900">実績ハイライト</h2>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-apple-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="空の状態"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-callout text-apple-gray-500 mb-2">
            データが見つかりません
          </p>
          <p className="text-footnote text-apple-gray-400">
            発言データの解析を完了すると、こちらに実績が表示されます
          </p>
        </div>
      </div>
    );
  }

  const data = {
    labels: highlights.map((h) => h.clusterLabel),
    datasets: [
      {
        data: highlights.map((h) => h.count),
        backgroundColor: [
          "#007AFF", // apple-blue
          "#5856D6", // apple-indigo
          "#AF52DE", // apple-purple
          "#5AC8FA", // apple-teal
          "#34C759", // apple-green
          "#FF9500", // apple-orange
        ],
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverBorderColor: "rgba(255, 255, 255, 1)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create custom legend
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 600,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (context: any) => {
            return context[0].label;
          },
          label: (context: any) => {
            return `${context.parsed}件の発言`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg p-8 shadow-apple-card animate-scale-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-apple-blue to-apple-indigo rounded-apple-sm mr-4 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="チャート"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-headline text-apple-gray-900">実績ハイライト</h2>
        </div>

        <div className="text-right">
          <p className="text-caption text-apple-gray-500">総発言数</p>
          <p className="text-title-3 font-semibold text-apple-gray-900">
            {highlights.reduce((sum, h) => sum + h.count, 0)}件
          </p>
        </div>
      </div>

      <div className="h-80 mb-8">
        <Pie data={data} options={options} />
      </div>

      {/* Custom Legend */}
      <div className="space-y-3">
        {highlights.map((highlight, index) => (
          <div
            key={highlight.clusterLabel}
            className="group flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-apple border border-white/20 transition-all duration-200 hover:shadow-apple-elevated cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white"
                style={{
                  backgroundColor:
                    data.datasets[0].backgroundColor[
                      index % data.datasets[0].backgroundColor.length
                    ],
                }}
              />
              <span className="text-callout font-medium text-apple-gray-900 group-hover:text-apple-gray-800 transition-colors">
                {highlight.clusterLabel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-callout font-semibold text-apple-gray-700">
                {highlight.count}件
              </span>
              <div className="text-apple-gray-400 group-hover:text-apple-gray-500 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="詳細を表示"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-footnote text-apple-gray-500 text-center">
          議会発言をAIで分析・分類しています
        </p>
      </div>
    </div>
  );
}
