import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getRepositories,
  getVectorSearch,
  getEmbeddingClient,
} from "../../../container";
import { retrieve } from "../../../ai/retriever";
import { buildPrompt } from "../../../ai/prompt";
import { getMessage } from "../../../i18n/ja";
import { logger } from "../../../utils/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const requestInfo = {
    method: "POST",
    url: request.url,
    userAgent: request.headers.get("user-agent") || undefined,
  };

  try {
    logger.info("Chat request received", { url: request.url });

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("Invalid JSON in chat request", {
        error: parseError,
        ...requestInfo,
      });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.question || typeof body.question !== "string") {
      logger.warn("Invalid question parameter", { body, ...requestInfo });
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    const { question } = body;
    logger.debug("Processing chat question", { question, ...requestInfo });
    const { speechesRepo } = getRepositories();
    const vectorSearch = getVectorSearch();
    const embeddingClient = getEmbeddingClient();

    // Retrieve relevant chunks
    const retrievedChunks = await retrieve(
      question,
      5,
      vectorSearch,
      speechesRepo,
      embeddingClient
    );
    const chunks = retrievedChunks.map((r) => r.chunk);

    // Build prompt
    const prompt = buildPrompt({ question, chunks });

    // If no chunks found, return immediate response with i18n message
    if (chunks.length === 0) {
      logger.info("No relevant chunks found for question", {
        question,
        ...requestInfo,
      });
      const noInfoMessage = getMessage("errors.noInformation");
      return new NextResponse(noInfoMessage, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    logger.info("Retrieved chunks for RAG", {
      chunkCount: chunks.length,
      question: question.substring(0, 100) + "...",
      ...requestInfo,
    });

    // Strict mode: Enhanced prompt with explicit source URL requirements
    const expectedUrls = chunks.map((chunk) => chunk.sourceUrl);
    const urlList = expectedUrls.join(", ");

    // Add strict citation requirements to system prompt
    const enhancedSystemPrompt =
      prompt.system +
      `

重要: 回答には以下のURL群から必ず1つ以上を含めてください: ${urlList}
URLが含まれていない回答は「情報がありません。」に置き換えられます。`;
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { role: "user", content: prompt.user },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (streamError) {
          logger.error("Streaming error", streamError);
          controller.error(streamError);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    logger.apiError("Chat API error", error as Error, requestInfo);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
