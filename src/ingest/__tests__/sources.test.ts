import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock pdf-parse module
vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { HtmlAdapter, PdfAdapter, type FileReader } from "../sources";
import pdfParse from "pdf-parse";

const mockPdfParse = vi.mocked(pdfParse);

// Create mock FileReader
const createMockFileReader = (): FileReader => ({
  readText: vi.fn(),
  readBuffer: vi.fn(),
});

describe("HtmlAdapter", () => {
  let htmlAdapter: HtmlAdapter;
  let mockFileReader: FileReader;

  beforeEach(() => {
    mockFileReader = createMockFileReader();
    htmlAdapter = new HtmlAdapter(mockFileReader);
    vi.clearAllMocks();
  });

  test("should parse simple HTML with speech content", async () => {
    const mockHtml = `
      <html>
        <body>
          <div class="speech-date">2024-03-15</div>
          <div class="session">令和6年第1回定例会</div>
          <div class="speaker">池元勝議員</div>
          <div class="content">
            <p>教育について質問いたします。</p>
            <p>子育て支援の充実が必要だと考えます。</p>
          </div>
        </body>
      </html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const speeches = await htmlAdapter.parse("/mock/path/speech.html");

    expect(speeches).toHaveLength(1);
    expect(speeches[0]).toMatchObject({
      date: new Date("2024-03-15"),
      session: "令和6年第1回定例会",
      speaker: "池元勝議員",
      content: expect.stringContaining("教育について質問いたします"),
      sourceUrl: "/mock/path/speech.html",
    });
  });

  test("should handle empty HTML gracefully", async () => {
    const mockHtml = "<html><body></body></html>";

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const speeches = await htmlAdapter.parse("/mock/empty.html");

    expect(speeches).toHaveLength(0);
  });

  test("should extract multiple speeches from HTML", async () => {
    const mockHtml = `
      <html>
        <body>
          <div class="speech">
            <div class="speech-date">2024-03-15</div>
            <div class="session">令和6年第1回定例会</div>
            <div class="speaker">池元勝議員</div>
            <div class="content">教育について質問いたします。</div>
          </div>
          <div class="speech">
            <div class="speech-date">2024-03-16</div>
            <div class="session">令和6年第1回定例会</div>
            <div class="speaker">田中議員</div>
            <div class="content">福祉について質問いたします。</div>
          </div>
        </body>
      </html>
    `;

    vi.mocked(mockFileReader.readText).mockResolvedValue(mockHtml);

    const speeches = await htmlAdapter.parse("/mock/multi.html");

    expect(speeches).toHaveLength(2);
    expect(speeches[0].speaker).toBe("池元勝議員");
    expect(speeches[1].speaker).toBe("田中議員");
  });
});

describe("PdfAdapter", () => {
  let pdfAdapter: PdfAdapter;
  let mockFileReader: FileReader;

  beforeEach(() => {
    mockFileReader = createMockFileReader();
    pdfAdapter = new PdfAdapter(mockFileReader);
    vi.clearAllMocks();
  });

  test("should parse PDF with speech content", async () => {
    const mockPdfText = `
      令和6年第1回定例会
      2024年3月15日
      
      池元勝議員：
      教育について質問いたします。
      子育て支援の充実が必要だと考えます。
    `;

    vi.mocked(mockFileReader.readBuffer).mockResolvedValue(
      Buffer.from("mock-pdf-buffer")
    );
    mockPdfParse.mockResolvedValue({
      text: mockPdfText,
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: "v1.10.100",
    });

    const speeches = await pdfAdapter.parse("/mock/speech.pdf");

    expect(speeches).toHaveLength(1);
    expect(speeches[0]).toMatchObject({
      session: "令和6年第1回定例会",
      speaker: "池元勝議員",
      content: expect.stringContaining("教育について質問いたします"),
      sourceUrl: "/mock/speech.pdf",
    });
    expect(speeches[0].date.getFullYear()).toBe(2024);
    expect(speeches[0].date.getMonth()).toBe(2); // March is month 2 (0-indexed)
    expect(speeches[0].date.getDate()).toBe(15);
  });

  test("should handle PDF parsing errors gracefully", async () => {
    vi.mocked(mockFileReader.readBuffer).mockRejectedValue(
      new Error("File not found")
    );

    await expect(pdfAdapter.parse("/nonexistent.pdf")).rejects.toThrow(
      "File not found"
    );
  });

  test("should handle empty PDF gracefully", async () => {
    vi.mocked(mockFileReader.readBuffer).mockResolvedValue(Buffer.from(""));
    mockPdfParse.mockResolvedValue({
      text: "",
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: null,
      version: "v1.10.100",
    });

    const speeches = await pdfAdapter.parse("/mock/empty.pdf");

    expect(speeches).toHaveLength(0);
  });
});
