import { SpeechChunk } from "../domain/types";

interface BuildPromptInput {
  question: string;
  chunks: SpeechChunk[];
}

interface PromptResult {
  system: string;
  user: string;
}

export function buildPrompt({
  question,
  chunks,
}: BuildPromptInput): PromptResult {
  const system = `あなたは池元勝市議の政治活動について詳しいアシスタントです。

以下のルールを厳格に守ってください：
1. 日本語でカジュアルな口調で回答してください
2. 提供された発言内容からのみ回答し、必ず引用元のsource_urlを含めてください
3. 提供された情報で回答できない場合は「情報がありません。」と回答してください
4. 推測や一般的な知識は使わず、発言内容に基づいた事実のみを回答してください
5. 回答には必ず出典URLを含めてください
6. 【重要】出典URLが含まれていない回答は無効とみなされ、「情報がありません。」に自動的に置き換えられます`;

  if (chunks.length === 0) {
    return {
      system,
      user: `質問: ${question}

提供された発言内容:
（なし）

回答: 情報がありません。`,
    };
  }

  const chunksText = chunks
    .map(
      (chunk, index) => `[${index + 1}] ${chunk.text}\n出典: ${chunk.sourceUrl}`
    )
    .join("\n\n");

  const user = `質問: ${question}

提供された発言内容:
${chunksText}

上記の発言内容から質問に答えてください。必ず出典URLを含めて回答してください。`;

  return {
    system,
    user,
  };
}
