/**
 * Chunks Japanese text into smaller segments based on sentence endings.
 * Splits on Japanese sentence ending punctuation: 。！？…
 *
 * @param text - The text to chunk
 * @returns Array of text chunks, with whitespace trimmed and empty chunks filtered out
 */
export function chunk(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split on sentence endings, but handle special cases
  // Skip consecutive punctuation marks

  const chunks: string[] = [];
  let currentChunk = "";
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Check for sentence endings
    if (char === "。" || char === "！" || char === "？") {
      currentChunk += char;

      // Skip any consecutive punctuation of the same type (don't add them to chunk)
      while (i + 1 < text.length && text[i + 1] === char) {
        i++;
      }

      // Add this chunk
      const trimmed = currentChunk.trim();
      if (trimmed) {
        chunks.push(trimmed);
      }
      currentChunk = "";
    } else if (char === "…") {
      currentChunk += char;

      // For ellipsis, check if next character starts a new sentence
      const nextChar = text[i + 1];
      if (!nextChar || /\s/.test(nextChar)) {
        // End of text or followed by whitespace - treat as sentence end
        const trimmed = currentChunk.trim();
        if (trimmed) {
          chunks.push(trimmed);
        }
        currentChunk = "";
      }
    } else {
      currentChunk += char;
    }

    i++;
  }

  // Add any remaining text as a chunk
  const remaining = currentChunk.trim();
  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.filter((chunk) => chunk.length > 0);
}
