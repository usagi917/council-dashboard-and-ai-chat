import { describe, it, expect } from "vitest";
import { getRepos } from "../container";

describe("Container", () => {
  it("should return repository instances", () => {
    const repos = getRepos();

    expect(repos.speeches).toBeDefined();
    expect(repos.highlights).toBeDefined();
    expect(repos.sns).toBeDefined();

    expect(typeof repos.speeches.list).toBe("function");
    expect(typeof repos.speeches.getChunksByIds).toBe("function");
    expect(typeof repos.highlights.list).toBe("function");
    expect(typeof repos.sns.latest).toBe("function");
  });

  it("should return the same instances on multiple calls", () => {
    const repos1 = getRepos();
    const repos2 = getRepos();

    expect(repos1.speeches).toBe(repos2.speeches);
    expect(repos1.highlights).toBe(repos2.highlights);
    expect(repos1.sns).toBe(repos2.sns);
  });
});
