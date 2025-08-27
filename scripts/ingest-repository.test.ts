import { describe, test, expect, vi, beforeEach } from "vitest";
import { ingestToRepository } from "./ingest-repository";
import type { Speech, SpeechChunk } from "../src/domain/types";
import type {
  SpeechesRepo,
  HighlightsRepo,
  SnsRepo,
  EmbeddingsRepo,
} from "../src/ports/repositories";
import type { FileReader } from "../src/ingest/sources";

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

// Create a mock writable speeches repository
const createMockSpeechesRepo = (): SpeechesRepo => ({
  list: vi.fn(),
  getChunksByIds: vi.fn(),
  getAllChunks: vi.fn(),
  insertSpeech: vi.fn(),
  insertChunk: vi.fn(),
  updateSpeech: vi.fn(),
  deleteSpeech: vi.fn(),
});

const createMockRepositories = () => ({
  speechesRepo: createMockSpeechesRepo(),
  highlightsRepo: {} as HighlightsRepo,
  snsRepo: {} as SnsRepo,
  embeddingsRepo: {} as EmbeddingsRepo,
});

describe("Ingest to Repository", () => {
  let mockFileReader: FileReader;

  beforeEach(() => {
    mockFileReader = createMockFileReader();
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("should parse HTML file and insert speech and chunks to repository", async () => {
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

    // Create mock repositories
    const repos = createMockRepositories();

    // Mock the insertSpeech to return a speech ID
    vi.mocked(repos.speechesRepo.insertSpeech).mockResolvedValue(123);
    vi.mocked(repos.speechesRepo.insertChunk).mockResolvedValue(undefined);

    // Run ingest
    const result = await ingestToRepository(
      "./fixtures",
      repos,
      mockFileReader
    );

    // Verify parsing results
    expect(result.speechCount).toBe(1);
    expect(result.chunkCount).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);

    // Verify insertSpeech was called with correct data
    expect(repos.speechesRepo.insertSpeech).toHaveBeenCalledTimes(1);
    const insertedSpeech = vi.mocked(repos.speechesRepo.insertSpeech).mock
      .calls[0][0];
    expect(insertedSpeech.speaker).toBe("田中太郎議員");
    expect(insertedSpeech.session).toBe("令和6年第1回定例会");
    expect(insertedSpeech.date.toISOString().split("T")[0]).toBe("2024-03-15");
    expect(insertedSpeech.sourceUrl).toBe("./fixtures/test-speech.html");

    // Verify chunks were inserted
    expect(repos.speechesRepo.insertChunk).toHaveBeenCalled();
    const insertedChunk = vi.mocked(repos.speechesRepo.insertChunk).mock
      .calls[0][0];
    expect(insertedChunk.speechId).toBe(123);
    expect(insertedChunk.idx).toBe(0);
    expect(insertedChunk.text).toContain("環境問題について");
  });

  test("should handle multiple files correctly", async () => {
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

    const repos = createMockRepositories();
    vi.mocked(repos.speechesRepo.insertSpeech)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(101);

    const result = await ingestToRepository(
      "./fixtures",
      repos,
      mockFileReader
    );

    // Verify results
    expect(result.speechCount).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify both speeches were inserted
    expect(repos.speechesRepo.insertSpeech).toHaveBeenCalledTimes(2);

    const call1 = vi.mocked(repos.speechesRepo.insertSpeech).mock.calls[0][0];
    const call2 = vi.mocked(repos.speechesRepo.insertSpeech).mock.calls[1][0];

    expect([call1.speaker, call2.speaker].sort()).toEqual([
      "佐藤花子議員",
      "山田次郎議員",
    ]);
  });

  test("should handle repository insertion errors gracefully", async () => {
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

    const repos = createMockRepositories();

    // Mock insertSpeech to fail
    vi.mocked(repos.speechesRepo.insertSpeech).mockRejectedValue(
      new Error("Database connection error")
    );

    const result = await ingestToRepository(
      "./fixtures",
      repos,
      mockFileReader
    );

    expect(result.speechCount).toBe(1); // Parsing succeeded
    expect(result.errors).toHaveLength(1); // But persistence failed
    expect(result.errors[0]).toContain("Database connection error");
  });

  test("should handle chunk insertion errors gracefully", async () => {
    mockGlob.mockResolvedValue(["./fixtures/test.html"]);

    const mockHtml = `
      <html><body>
        <div class="speech-date">2024-03-15</div>
        <div class="session">test session</div>  
        <div class="speaker">test speaker</div>
        <div class="content">First sentence. Second sentence.</div>
      </body></html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const repos = createMockRepositories();

    // Mock speech insertion to succeed but chunk insertion to fail
    vi.mocked(repos.speechesRepo.insertSpeech).mockResolvedValue(123);
    vi.mocked(repos.speechesRepo.insertChunk).mockRejectedValue(
      new Error("Chunk insertion failed")
    );

    const result = await ingestToRepository(
      "./fixtures",
      repos,
      mockFileReader
    );

    expect(result.speechCount).toBe(1); // Speech was processed
    expect(result.errors).toHaveLength(1); // But chunk insertion failed
    expect(result.errors[0]).toContain("Chunk insertion failed");
  });

  test("should skip unsupported file types", async () => {
    mockGlob.mockResolvedValue([
      "./fixtures/speech.html",
      "./fixtures/readme.txt",
      "./fixtures/image.jpg",
    ]);

    const mockHtml = `
      <html><body>
        <div class="speech-date">2024-03-15</div>
        <div class="session">test session</div>
        <div class="speaker">test speaker</div>
        <div class="content">test content</div>
      </body></html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const repos = createMockRepositories();
    vi.mocked(repos.speechesRepo.insertSpeech).mockResolvedValue(123);

    const result = await ingestToRepository(
      "./fixtures",
      repos,
      mockFileReader
    );

    expect(result.files).toHaveLength(1); // Only HTML file processed
    expect(result.files[0]).toBe("./fixtures/speech.html");
    expect(repos.speechesRepo.insertSpeech).toHaveBeenCalledTimes(1);
  });
});
