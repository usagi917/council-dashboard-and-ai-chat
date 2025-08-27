#!/usr/bin/env tsx

import { glob } from "glob";
import path from "node:path";
import {
  HtmlAdapter,
  PdfAdapter,
  NodeFileReader,
  type FileReader,
} from "../src/ingest/sources";
import { chunk } from "../src/ingest/chunker";
import type { Speech, SpeechChunk } from "../src/domain/types";
import type {
  SpeechesRepo,
  HighlightsRepo,
  SnsRepo,
  EmbeddingsRepo,
} from "../src/ports/repositories";

export interface Repositories {
  speechesRepo: SpeechesRepo;
  highlightsRepo: HighlightsRepo;
  snsRepo: SnsRepo;
  embeddingsRepo: EmbeddingsRepo;
}

export interface IngestRepositoryResult {
  speechCount: number;
  chunkCount: number;
  files: string[];
  errors: string[];
}

/**
 * Ingest fixtures from a directory and persist to repositories
 */
export async function ingestToRepository(
  directoryPath: string,
  repositories: Repositories,
  fileReader: FileReader = new NodeFileReader()
): Promise<IngestRepositoryResult> {
  const result: IngestRepositoryResult = {
    speechCount: 0,
    chunkCount: 0,
    files: [],
    errors: [],
  };

  try {
    // Discover HTML and PDF files
    const pattern = path.join(directoryPath, "**/*.{html,htm,pdf}");
    const files = await glob(pattern);

    console.log(`🔍 Found ${files.length} files to process`);

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

        // Process each speech and persist to repository
        for (const speech of speeches) {
          try {
            // Insert the speech
            const speechId =
              await repositories.speechesRepo.insertSpeech(speech);

            // Process content into chunks
            const speechChunks = chunk(speech.content);
            result.chunkCount += speechChunks.length;

            // Insert each chunk
            for (let i = 0; i < speechChunks.length; i++) {
              const speechChunk: SpeechChunk = {
                id: 0, // Will be assigned by repository
                speechId: speechId,
                idx: i,
                text: speechChunks[i],
                sourceUrl: speech.sourceUrl,
              };

              await repositories.speechesRepo.insertChunk(speechChunk);
            }

            // Log the successful processing
            console.log(`📄 Processed & stored: ${filePath}`);
            console.log(`   Speaker: ${speech.speaker}`);
            console.log(`   Date: ${speech.date.toISOString().split("T")[0]}`);
            console.log(`   Session: ${speech.session}`);
            console.log(`   Content length: ${speech.content.length} chars`);
            console.log(`   Chunks created: ${speechChunks.length}`);
            console.log(`   Speech ID: ${speechId}`);
            console.log(`   Source: ${speech.sourceUrl}`);
            console.log("");
          } catch (persistError) {
            const errorMessage = `Error persisting speech from ${filePath}: ${persistError}`;
            result.errors.push(errorMessage);
            console.error(`❌ ${errorMessage}`);
            // Continue processing other speeches even if one fails
          }
        }
      } catch (parseError) {
        const errorMessage = `Error processing ${filePath}: ${parseError}`;
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

/**
 * CLI entry point that uses the configured repositories
 */
export async function mainWithRepository() {
  const args = process.argv.slice(2);
  const directoryPath = args[0] || "./fixtures";

  console.log(`🔍 Starting ingest from: ${directoryPath}`);
  console.log("");

  // Import the container to get configured repositories
  const { getRepositories } = await import("../src/container");
  const repositories = getRepositories();

  const result = await ingestToRepository(directoryPath, repositories);

  if (result.errors.length > 0) {
    console.error(`\n❌ Completed with ${result.errors.length} errors`);
    process.exit(1);
  } else {
    console.log(`\n✅ Ingest completed successfully`);
    console.log("🎯 Data has been persisted to the configured repositories");

    // Verify the data was stored by checking the count
    const speechList = await repositories.speechesRepo.list(1, 1);
    console.log(`📊 Total speeches in repository: ${speechList.total}`);

    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  mainWithRepository().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
