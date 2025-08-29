import { describe, it, expect } from "vitest";
import { getVectorTopK } from "./search";

describe("getVectorTopK", () => {
  it("returns default 5 when not set", () => {
    const prev = process.env.VECTOR_TOP_K;
    delete process.env.VECTOR_TOP_K;
    try {
      expect(getVectorTopK()).toBe(5);
    } finally {
      if (prev !== undefined) process.env.VECTOR_TOP_K = prev;
    }
  });

  it("parses and clamps valid numbers", () => {
    const prev = process.env.VECTOR_TOP_K;
    try {
      process.env.VECTOR_TOP_K = "7";
      expect(getVectorTopK()).toBe(7);

      process.env.VECTOR_TOP_K = "0";
      expect(getVectorTopK()).toBe(5); // invalid -> default

      process.env.VECTOR_TOP_K = "100";
      expect(getVectorTopK()).toBe(20); // clamped
    } finally {
      if (prev !== undefined) process.env.VECTOR_TOP_K = prev;
      else delete process.env.VECTOR_TOP_K;
    }
  });
});
