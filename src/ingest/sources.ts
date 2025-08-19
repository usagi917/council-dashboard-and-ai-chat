import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";
import type { Speech } from "../domain/types";

export interface FileReader {
  readText(filePath: string): Promise<string>;
  readBuffer(filePath: string): Promise<Buffer>;
}

export class NodeFileReader implements FileReader {
  async readText(filePath: string): Promise<string> {
    return await readFile(filePath, "utf-8");
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    return await readFile(filePath);
  }
}

export interface SourceAdapter {
  parse(filePath: string): Promise<Speech[]>;
}

export class HtmlAdapter implements SourceAdapter {
  constructor(private fileReader: FileReader = new NodeFileReader()) {}

  async parse(filePath: string): Promise<Speech[]> {
    try {
      const htmlContent = await this.fileReader.readText(filePath);
      const $ = cheerio.load(htmlContent);
      const speeches: Speech[] = [];

      // Try multiple patterns to extract speech data
      const speechElements = $(".speech");

      if (speechElements.length > 0) {
        // Pattern 1: Multiple speech elements
        speechElements.each((index, element) => {
          const $element = $(element);
          const speech = this.extractSpeechFromElement(
            $element,
            filePath,
            index + 1
          );
          if (speech) {
            speeches.push(speech);
          }
        });
      } else {
        // Pattern 2: Single speech document
        const speech = this.extractSpeechFromElement($("body"), filePath, 1);
        if (speech) {
          speeches.push(speech);
        }
      }

      return speeches;
    } catch (error) {
      throw new Error(`Failed to parse HTML file ${filePath}: ${error}`);
    }
  }

  private extractSpeechFromElement(
    $element: cheerio.Cheerio<any>,
    filePath: string,
    id: number
  ): Speech | null {
    // Extract date
    const dateText =
      $element.find(".speech-date").text().trim() ||
      $element.find('[class*="date"]').text().trim();

    // Extract session
    const session =
      $element.find(".session").text().trim() ||
      $element.find('[class*="session"]').text().trim();

    // Extract speaker
    const speaker =
      $element.find(".speaker").text().trim() ||
      $element.find('[class*="speaker"]').text().trim();

    // Extract content
    const content =
      $element.find(".content").text().trim() ||
      $element.find('[class*="content"]').text().trim() ||
      $element
        .find("p")
        .map((_, el) => cheerio.load(el).text())
        .get()
        .join("\n")
        .trim();

    // Validate required fields
    if (!dateText || !session || !speaker || !content) {
      return null;
    }

    // Parse date
    let date: Date;
    try {
      // Try different date formats
      if (dateText.match(/\d{4}-\d{2}-\d{2}/)) {
        date = new Date(dateText);
      } else if (dateText.match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
        const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
          date = new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3])
          );
        } else {
          date = new Date();
        }
      } else {
        date = new Date(dateText);
      }
    } catch {
      date = new Date();
    }

    return {
      id,
      date,
      session: session || "不明",
      speaker: speaker || "不明",
      content: content.replace(/\s+/g, " ").trim(),
      sourceUrl: filePath,
    };
  }
}

export class PdfAdapter implements SourceAdapter {
  constructor(private fileReader: FileReader = new NodeFileReader()) {}

  async parse(filePath: string): Promise<Speech[]> {
    try {
      const pdfBuffer = await this.fileReader.readBuffer(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      if (!text.trim()) {
        return [];
      }

      return this.extractSpeechesFromText(text, filePath);
    } catch (error) {
      throw new Error(`Failed to parse PDF file ${filePath}: ${error}`);
    }
  }

  private extractSpeechesFromText(text: string, filePath: string): Speech[] {
    const speeches: Speech[] = [];
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) {
      return speeches;
    }

    // Extract session and date from the beginning of the document
    let session = "不明";
    let date = new Date();

    // Look for session pattern (e.g., "令和6年第1回定例会")
    const sessionPattern = /[令平]和\d+年第\d+回[定臨]例会/;
    const sessionMatch = text.match(sessionPattern);
    if (sessionMatch) {
      session = sessionMatch[0];
    }

    // Look for date pattern
    const datePattern = /(\d{4})[年\-.](\d{1,2})[月\-.](\d{1,2})[日]?/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      date = new Date(
        parseInt(dateMatch[1]),
        parseInt(dateMatch[2]) - 1,
        parseInt(dateMatch[3])
      );
    }

    // Look for speaker patterns (e.g., "池元勝議員：" or "○池元勝議員")
    const speakerPattern = /([○◯]?)([^：\n]+議員)[：]/g;
    let match: RegExpExecArray | null;
    let speechIndex = 1;

    while ((match = speakerPattern.exec(text)) !== null) {
      const speaker = match[2];
      const speakerPosition = match.index + match[0].length;

      // Find the content after the speaker name until the next speaker or end
      const nextSpeakerMatch = speakerPattern.exec(text);
      const contentEnd = nextSpeakerMatch
        ? nextSpeakerMatch.index
        : text.length;
      speakerPattern.lastIndex = match.index + match[0].length; // Reset for next iteration

      const content = text
        .substring(speakerPosition, contentEnd)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (content && speaker) {
        speeches.push({
          id: speechIndex++,
          date,
          session,
          speaker: speaker.trim(),
          content,
          sourceUrl: filePath,
        });
      }
    }

    // If no speaker patterns found, treat the whole document as one speech
    if (speeches.length === 0 && text.trim()) {
      speeches.push({
        id: 1,
        date,
        session,
        speaker: "不明",
        content: text.replace(/\s+/g, " ").trim(),
        sourceUrl: filePath,
      });
    }

    return speeches;
  }
}
