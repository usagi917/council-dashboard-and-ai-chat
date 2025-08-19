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
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-blue-900">実績ハイライト</h2>
        <p className="text-gray-500">データが見つかりません</p>
      </section>
    );
  }

  const data = {
    labels: highlights.map((h) => h.clusterLabel),
    datasets: [
      {
        data: highlights.map((h) => h.count),
        backgroundColor: [
          "#3B82F6", // blue-500
          "#10B981", // emerald-500
          "#F59E0B", // amber-500
          "#EF4444", // red-500
          "#8B5CF6", // violet-500
          "#EC4899", // pink-500
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-900">実績ハイライト</h2>

      <div className="h-64 mb-6">
        <Pie data={data} options={options} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {highlights.map((highlight, index) => (
          <div
            key={highlight.clusterLabel}
            className="flex items-center justify-between p-3 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    data.datasets[0].backgroundColor[
                      index % data.datasets[0].backgroundColor.length
                    ],
                }}
              />
              <span className="text-sm font-medium">
                {highlight.clusterLabel}
              </span>
            </div>
            <span className="text-sm text-gray-600">{highlight.count}件</span>
          </div>
        ))}
      </div>
    </section>
  );
}
