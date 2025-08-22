"use client";

import { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import type { Highlight, SpeechChunk } from "../../domain/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GraphViewProps {
  highlights: Highlight[];
  sampleChunks: SpeechChunk[];
}

export default function GraphView({
  highlights,
  sampleChunks,
}: GraphViewProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  if (highlights.length === 0) {
    return (
      <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg p-8 shadow-apple-card animate-scale-in">
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
    onClick: (event: any, elements: any) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const clusterLabel = highlights[index].clusterLabel;
        setSelectedCluster(
          clusterLabel === selectedCluster ? null : clusterLabel
        );
      }
    },
  };

  const getSelectedSampleChunk = (): SpeechChunk | null => {
    if (!selectedCluster) return null;

    const highlight = highlights.find(
      (h) => h.clusterLabel === selectedCluster
    );
    if (!highlight) return null;

    return (
      sampleChunks.find((chunk) => chunk.id === highlight.sampleChunkId) || null
    );
  };

  const selectedSampleChunk = getSelectedSampleChunk();

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-callout font-medium text-apple-blue hover:text-apple-blue/80 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-label="戻る"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          ホームに戻る
        </Link>
      </div>

      {/* Pie Chart Section */}
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
            <h2 className="text-headline text-apple-gray-900">発言分類分析</h2>
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
              data-testid={`cluster-${highlight.clusterLabel}`}
              className={`group flex items-center justify-between p-4 rounded-apple border border-white/20 transition-all duration-200 cursor-pointer ${
                selectedCluster === highlight.clusterLabel
                  ? "bg-apple-blue/10 border-apple-blue/30 shadow-apple-elevated"
                  : "bg-white/50 hover:bg-white/80 hover:shadow-apple-elevated"
              }`}
              onClick={() =>
                setSelectedCluster(
                  highlight.clusterLabel === selectedCluster
                    ? null
                    : highlight.clusterLabel
                )
              }
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
                <span
                  className={`text-callout font-medium transition-colors ${
                    selectedCluster === highlight.clusterLabel
                      ? "text-apple-blue"
                      : "text-apple-gray-900 group-hover:text-apple-gray-800"
                  }`}
                >
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
                      d={
                        selectedCluster === highlight.clusterLabel
                          ? "M19 9l-7 7-7-7"
                          : "M9 5l7 7-7 7"
                      }
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

      {/* Representative Speech Section */}
      {selectedSampleChunk && (
        <div className="backdrop-blur-apple bg-white/70 border border-white/20 rounded-apple-lg p-8 shadow-apple-card animate-scale-in">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-apple-purple to-apple-indigo rounded-apple-sm mr-4 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="代表発言"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-headline text-apple-gray-900">
              「{selectedCluster}」の代表発言
            </h3>
          </div>

          <div className="bg-white/50 rounded-apple-lg p-6 mb-6">
            <blockquote className="text-body text-apple-gray-800 leading-relaxed mb-4">
              {selectedSampleChunk.text}
            </blockquote>

            <div className="flex justify-between items-center">
              <p className="text-caption text-apple-gray-500">
                発言ID: {selectedSampleChunk.speechId}
              </p>

              <a
                href={selectedSampleChunk.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-apple-blue text-white text-callout font-medium rounded-apple hover:bg-apple-blue/80 transition-colors shadow-sm"
              >
                議事録を確認
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="外部リンク"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
