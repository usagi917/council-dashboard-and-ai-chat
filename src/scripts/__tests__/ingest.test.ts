import { describe, test, expect, vi, beforeEach } from "vitest";
import { parseFixturesDirectory } from "../ingest";
import type { FileReader } from "../../ingest/sources";

// Mock the file system operations
const createMockFileReader = (): FileReader => ({
  readText: vi.fn(),
  readBuffer: vi.fn(),
});

// Mock glob for file discovery
vi.mock("glob", () => ({
  glob: vi.fn(),
}));

// Mock pdf-parse at the top level to prevent it from loading test files
vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { glob } from "glob";
import pdfParse from "pdf-parse";

const mockGlob = vi.mocked(glob);
const mockPdfParse = vi.mocked(pdfParse);

describe("ingest script", () => {
  let mockFileReader: FileReader;

  beforeEach(() => {
    mockFileReader = createMockFileReader();
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("should discover and parse HTML files in directory", async () => {
    // Mock file discovery
    mockGlob.mockResolvedValue([
      "/fixtures/sample1.html",
      "/fixtures/sample2.html",
    ]);

    // Mock file content
    const mockHtml = `
      <html>
        <body>
          <div class="speech-date">2024-03-15</div>
          <div class="session">令和6年第1回定例会</div>
          <div class="speaker">池元勝議員</div>
          <div class="content">教育について質問いたします。</div>
        </body>
      </html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const result = await parseFixturesDirectory("/fixtures", mockFileReader);

    expect(result.speechCount).toBe(2);
    expect(result.chunkCount).toBe(2); // Each speech creates 1 chunk
    expect(result.files).toEqual([
      "/fixtures/sample1.html",
      "/fixtures/sample2.html",
    ]);
  });

  test("should discover and parse PDF files", async () => {
    mockGlob.mockResolvedValue(["/fixtures/sample.pdf"]);

    const mockPdfText = `
      令和6年第1回定例会
      2024年3月15日
      
      池元勝議員：
      教育について質問いたします。
    `;

    vi.mocked(mockFileReader.readBuffer).mockResolvedValue(
      Buffer.from("mock-pdf")
    );

    // Mock pdf-parse
    mockPdfParse.mockResolvedValue({
      text: mockPdfText,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: "v1.10.100",
    });

    const result = await parseFixturesDirectory("/fixtures", mockFileReader);

    expect(result.speechCount).toBe(1);
    expect(result.chunkCount).toBe(1); // One speech with one sentence creates 1 chunk
  });

  test("should handle mixed file types", async () => {
    mockGlob.mockResolvedValue([
      "/fixtures/sample.html",
      "/fixtures/sample.pdf",
      "/fixtures/readme.txt", // Should be ignored
    ]);

    vi.mocked(mockFileReader.readText).mockResolvedValue(
      '<html><body><div class="speech-date">2024-03-15</div><div class="session">令和6年第1回定例会</div><div class="speaker">議員</div><div class="content">質問。</div></body></html>'
    );
    vi.mocked(mockFileReader.readBuffer).mockResolvedValue(
      Buffer.from("mock-pdf")
    );

    const result = await parseFixturesDirectory("/fixtures", mockFileReader);

    expect(result.files).toHaveLength(2); // Should only process HTML and PDF
    expect(result.files).toEqual([
      "/fixtures/sample.html",
      "/fixtures/sample.pdf",
    ]);
  });

  test("should handle errors gracefully", async () => {
    mockGlob.mockResolvedValue(["/fixtures/bad.html"]);

    vi.mocked(mockFileReader.readText).mockRejectedValue(
      new Error("File not found")
    );

    const result = await parseFixturesDirectory("/fixtures", mockFileReader);

    expect(result.speechCount).toBe(0);
    expect(result.chunkCount).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("File not found");
  });

  test("should return empty result for empty directory", async () => {
    mockGlob.mockResolvedValue([]);

    const result = await parseFixturesDirectory("/fixtures", mockFileReader);

    expect(result.speechCount).toBe(0);
    expect(result.chunkCount).toBe(0);
    expect(result.files).toHaveLength(0);
  });
});
