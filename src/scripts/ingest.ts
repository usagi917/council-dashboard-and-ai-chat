import { glob } from "glob";
import path from "node:path";
import {
  HtmlAdapter,
  PdfAdapter,
  NodeFileReader,
  type FileReader,
} from "../ingest/sources";
import { chunk } from "../ingest/chunker";
import type { Speech } from "../domain/types";

export interface IngestResult {
  speechCount: number;
  chunkCount: number;
  files: string[];
  errors: string[];
}

export async function parseFixturesDirectory(
  directoryPath: string,
  fileReader: FileReader = new NodeFileReader()
): Promise<IngestResult> {
  const result: IngestResult = {
    speechCount: 0,
    chunkCount: 0,
    files: [],
    errors: [],
  };

  try {
    // Discover HTML and PDF files
    const pattern = path.join(directoryPath, "**/*.{html,htm,pdf}");
    const files = await glob(pattern);

    // Create adapters
    const htmlAdapter = new HtmlAdapter(fileReader);
    const pdfAdapter = new PdfAdapter(fileReader);

    for (const filePath of files) {
      try {
        const ext = path.extname(filePath).toLowerCase();
        let speeches: Speech[] = [];

        if (ext === ".html" || ext === ".htm") {
          speeches = await htmlAdapter.parse(filePath);
        } else if (ext === ".pdf") {
          speeches = await pdfAdapter.parse(filePath);
        } else {
          // Skip unsupported file types
          continue;
        }

        result.files.push(filePath);
        result.speechCount += speeches.length;

        // Process each speech into chunks
        for (const speech of speeches) {
          const speechChunks = chunk(speech.content);
          result.chunkCount += speechChunks.length;

          // Log the processing result for this speech
          console.log(`📄 Processed: ${filePath}`);
          console.log(`   Speaker: ${speech.speaker}`);
          console.log(`   Date: ${speech.date.toISOString().split("T")[0]}`);
          console.log(`   Session: ${speech.session}`);
          console.log(`   Content length: ${speech.content.length} chars`);
          console.log(`   Chunks created: ${speechChunks.length}`);
          console.log(`   Source: ${speech.sourceUrl}`);
          console.log("");
        }
      } catch (error) {
        const errorMessage = `Error processing ${filePath}: ${error}`;
        result.errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${result.files.length}`);
    console.log(`   Speeches extracted: ${result.speechCount}`);
    console.log(`   Chunks created: ${result.chunkCount}`);

    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
    }
  } catch (error) {
    const errorMessage = `Error scanning directory ${directoryPath}: ${error}`;
    result.errors.push(errorMessage);
    console.error(`❌ ${errorMessage}`);
  }

  return result;
}

// CLI entry point
export async function main() {
  const args = process.argv.slice(2);
  const directoryPath = args[0] || "./fixtures";

  console.log(`🔍 Starting ingest from: ${directoryPath}`);
  console.log("");

  const result = await parseFixturesDirectory(directoryPath);

  if (result.errors.length > 0) {
    console.error(`\n❌ Completed with ${result.errors.length} errors`);
    process.exit(1);
  } else {
    console.log(`\n✅ Ingest completed successfully`);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
