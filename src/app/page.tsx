import { getRepos } from "../container";
import HighlightPie from "../ui/components/HighlightPie";
import { Chat } from "../ui/components/Chat";

async function getHighlights() {
  const { highlights } = getRepos();
  return highlights.list();
}

export default async function Home() {
  const highlights = await getHighlights();

  return (
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

        <section className="mt-8">
          <Chat />
        </section>
      </div>
    </main>
  );
}
