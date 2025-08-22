import { getRepositories } from "../../container";
import GraphView from "../../ui/components/GraphView";

export default async function GraphPage() {
  const { highlightsRepo, speechesRepo } = getRepositories();

  const highlights = await highlightsRepo.list();

  // 各ハイライトのサンプルチャンクを取得
  const sampleChunkIds = highlights.map((h) => h.sampleChunkId);
  const sampleChunks =
    sampleChunkIds.length > 0
      ? await speechesRepo.getChunksByIds(sampleChunkIds)
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-display-large font-bold text-apple-gray-900 mb-4">
              発言分析グラフ
            </h1>
            <p className="text-headline text-apple-gray-600">
              議会発言をAIで分析・分類し、代表的な発言を確認できます
            </p>
          </div>

          <GraphView highlights={highlights} sampleChunks={sampleChunks} />
        </div>
      </div>
    </div>
  );
}
