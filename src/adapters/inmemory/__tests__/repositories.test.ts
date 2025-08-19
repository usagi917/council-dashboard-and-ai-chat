import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySpeechesRepo,
  InMemoryHighlightsRepo,
  InMemorySnsRepo,
} from "../repositories";

describe("InMemory Repositories", () => {
  describe("InMemorySpeechesRepo", () => {
    let repo: InMemorySpeechesRepo;

    beforeEach(() => {
      repo = new InMemorySpeechesRepo();
    });

    it("should list speeches with pagination", async () => {
      const result = await repo.list(1, 2);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.items[0].speaker).toBe("池元勝");
    });

    it("should handle page 2 correctly", async () => {
      const result = await repo.list(2, 2);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(3);
      expect(result.items[0].id).toBe(3);
    });

    it("should return empty array for invalid page", async () => {
      const result = await repo.list(10, 2);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(3);
    });

    it("should get chunks by IDs", async () => {
      const chunks = await repo.getChunksByIds([1, 3, 5]);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].id).toBe(1);
      expect(chunks[1].id).toBe(3);
      expect(chunks[2].id).toBe(5);
    });

    it("should return empty array for non-existent chunk IDs", async () => {
      const chunks = await repo.getChunksByIds([999]);

      expect(chunks).toHaveLength(0);
    });
  });

  describe("InMemoryHighlightsRepo", () => {
    let repo: InMemoryHighlightsRepo;

    beforeEach(() => {
      repo = new InMemoryHighlightsRepo();
    });

    it("should list all highlights", async () => {
      const highlights = await repo.list();

      expect(highlights).toHaveLength(2);
      expect(highlights[0].clusterLabel).toBe("教育政策");
      expect(highlights[0].count).toBe(15);
      expect(highlights[1].clusterLabel).toBe("地域福祉");
    });
  });

  describe("InMemorySnsRepo", () => {
    let repo: InMemorySnsRepo;

    beforeEach(() => {
      repo = new InMemorySnsRepo();
    });

    it("should get latest n posts", async () => {
      const posts = await repo.latest(1);

      expect(posts).toHaveLength(1);
      expect(posts[0].platform).toBe("instagram");
      expect(posts[0].content).toContain("市民の皆様と教育について");
    });

    it("should get all posts if n is larger than available", async () => {
      const posts = await repo.latest(10);

      expect(posts).toHaveLength(2);
    });

    it("should return empty array if n is 0", async () => {
      const posts = await repo.latest(0);

      expect(posts).toHaveLength(0);
    });
  });
});
