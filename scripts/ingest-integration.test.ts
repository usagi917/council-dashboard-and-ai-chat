import { describe, test, expect, vi, beforeEach } from "vitest";
import { ingestToRepository } from "./ingest-integration";
import { createInMemoryRepositories } from "../src/adapters/inmemory/repositories";
import type { FileReader } from "../src/ingest/sources";
import type { Container } from "../src/container";

// Mock glob and other file system dependencies
vi.mock("glob", () => ({
  glob: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { glob } from "glob";

const mockGlob = vi.mocked(glob);

// Mock file reader
const createMockFileReader = (): FileReader => ({
  readText: vi.fn(),
  readBuffer: vi.fn(),
});

// Helper to convert repository format to Container format
const toContainer = (
  repos: ReturnType<typeof createInMemoryRepositories>
): Container => ({
  speeches: repos.speechesRepo,
  highlights: repos.highlightsRepo,
  sns: repos.snsRepo,
  embeddings: repos.embeddingsRepo,
});

describe("Ingest Integration", () => {
  let mockFileReader: FileReader;

  beforeEach(() => {
    mockFileReader = createMockFileReader();
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("should ingest files and persist to repository", async () => {
    // Setup mock file discovery
    mockGlob.mockResolvedValue(["./fixtures/test-speech.html"]);

    // Setup mock HTML content
    const mockHtml = `
      <html>
        <body>
          <div class="speech-date">2024-03-15</div>
          <div class="session">令和6年第1回定例会</div>
          <div class="speaker">田中太郎議員</div>
          <div class="content">
            環境問題について質問いたします。
            地球温暖化対策は重要な課題です。
            市として何ができるでしょうか。
          </div>
        </body>
      </html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    // Create empty in-memory repositories for testing
    const repos = createInMemoryRepositories(false);
    const container = toContainer(repos);

    // Verify initial state is empty
    const initialSpeeches = await repos.speechesRepo.list(1, 10);
    expect(initialSpeeches.items).toHaveLength(0);

    // Run ingest
    const result = await ingestToRepository(
      "./fixtures",
      container,
      mockFileReader
    );

    // Verify parsing results
    expect(result.speechCount).toBe(1);
    expect(result.chunkCount).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);

    // Verify data was persisted to repository
    const speechesAfter = await repos.speechesRepo.list(1, 10);
    expect(speechesAfter.items).toHaveLength(1);

    const speech = speechesAfter.items[0];
    expect(speech.speaker).toBe("田中太郎議員");
    expect(speech.session).toBe("令和6年第1回定例会");
    expect(speech.date.toISOString().split("T")[0]).toBe("2024-03-15");
    expect(speech.sourceUrl).toBe("./fixtures/test-speech.html");
    expect(speech.content).toContain("環境問題について");

    // Verify chunks were created
    const chunks = await repos.speechesRepo.getChunksByIds([speech.id]);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain("環境問題について質問いたします");
  });

  test("should handle multiple files and accumulate data", async () => {
    // Setup multiple mock files
    mockGlob.mockResolvedValue([
      "./fixtures/speech1.html",
      "./fixtures/speech2.html",
    ]);

    const mockHtml1 = `
      <html><body>
        <div class="speech-date">2024-03-15</div>
        <div class="session">令和6年第1回定例会</div>
        <div class="speaker">佐藤花子議員</div>
        <div class="content">教育予算について質問します。</div>
      </body></html>
    `;

    const mockHtml2 = `
      <html><body>
        <div class="speech-date">2024-03-16</div>
        <div class="session">令和6年第1回定例会</div>
        <div class="speaker">山田次郎議員</div>
        <div class="content">福祉政策についてお聞きします。</div>
      </body></html>
    `;

    vi.mocked(mockFileReader.readText)
      .mockResolvedValueOnce(mockHtml1)
      .mockResolvedValueOnce(mockHtml2);

    const repos = createInMemoryRepositories(false);
    const container = toContainer(repos);
    const result = await ingestToRepository(
      "./fixtures",
      container,
      mockFileReader
    );

    // Verify results
    expect(result.speechCount).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify both speeches were persisted
    const speeches = await repos.speechesRepo.list(1, 10);
    expect(speeches.items).toHaveLength(2);

    const speakers = speeches.items.map((s) => s.speaker).sort();
    expect(speakers).toEqual(["佐藤花子議員", "山田次郎議員"]);
  });

  test("should handle repository errors gracefully", async () => {
    mockGlob.mockResolvedValue(["./fixtures/test.html"]);

    const mockHtml = `
      <html><body>
        <div class="speech-date">2024-03-15</div>
        <div class="session">test session</div>
        <div class="speaker">test speaker</div>
        <div class="content">test content</div>
      </body></html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    // Create mock repositories that fail
    const mockContainer: Container = {
      speeches: {
        list: vi.fn(),
        getChunksByIds: vi.fn(),
        getAllChunks: vi.fn(),
        insertSpeech: vi.fn().mockRejectedValue(new Error("Database error")),
        insertChunk: vi.fn(),
        updateSpeech: vi.fn(),
        deleteSpeech: vi.fn(),
      },
      highlights: {} as any,
      sns: {} as any,
      embeddings: {} as any,
    };

    const result = await ingestToRepository(
      "./fixtures",
      mockContainer,
      mockFileReader
    );

    expect(result.speechCount).toBe(1); // Parsing succeeded
    expect(result.errors).toHaveLength(1); // But persistence failed
    expect(result.errors[0]).toContain("Database error");
  });

  test("should skip files that fail to parse", async () => {
    mockGlob.mockResolvedValue(["./fixtures/good.html", "./fixtures/bad.html"]);

    vi.mocked(mockFileReader.readText)
      .mockResolvedValueOnce(
        `
        <html><body>
          <div class="speech-date">2024-03-15</div>
          <div class="session">test session</div>
          <div class="speaker">test speaker</div>
          <div class="content">test content</div>
        </body></html>
      `
      )
      .mockRejectedValueOnce(new Error("File read error"));

    const repos = createInMemoryRepositories(false);
    const container = toContainer(repos);
    const result = await ingestToRepository(
      "./fixtures",
      container,
      mockFileReader
    );

    expect(result.speechCount).toBe(1); // Only the good file processed
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("File read error");

    // Verify the good speech was still persisted
    const speeches = await repos.speechesRepo.list(1, 10);
    expect(speeches.items).toHaveLength(1);
  });
});
