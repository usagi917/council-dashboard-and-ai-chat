import { describe, test, expect } from "vitest";
import { chunk } from "../chunker";

describe("chunker", () => {
  test("should split Japanese text on sentence endings", () => {
    const text =
      "教育について質問いたします。子育て支援の充実が必要だと考えます。予算についても確認したいと思います。";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe("教育について質問いたします。");
    expect(chunks[1]).toBe("子育て支援の充実が必要だと考えます。");
    expect(chunks[2]).toBe("予算についても確認したいと思います。");
  });

  test("should handle exclamation marks", () => {
    const text = "これは重要な問題です！早急に対処すべきです！";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("これは重要な問題です！");
    expect(chunks[1]).toBe("早急に対処すべきです！");
  });

  test("should handle question marks", () => {
    const text = "本当にそうなのでしょうか？確認が必要ではないでしょうか？";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("本当にそうなのでしょうか？");
    expect(chunks[1]).toBe("確認が必要ではないでしょうか？");
  });

  test("should handle ellipsis", () => {
    const text =
      "これについては…検討が必要だと思います。さらに調査を…進めていきたいと思います。";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("これについては…検討が必要だと思います。");
    expect(chunks[1]).toBe("さらに調査を…進めていきたいと思います。");
  });

  test("should handle mixed punctuation", () => {
    const text =
      "市民の声を聞きました。本当に大変な状況です！どのように対応するのでしょうか？検討が必要ですね…";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toBe("市民の声を聞きました。");
    expect(chunks[1]).toBe("本当に大変な状況です！");
    expect(chunks[2]).toBe("どのように対応するのでしょうか？");
    expect(chunks[3]).toBe("検討が必要ですね…");
  });

  test("should handle empty text", () => {
    const chunks = chunk("");

    expect(chunks).toHaveLength(0);
  });

  test("should handle text without sentence endings", () => {
    const text = "教育について質問いたします";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("教育について質問いたします");
  });

  test("should trim whitespace from chunks", () => {
    const text =
      "教育について質問いたします。   子育て支援の充実が必要だと考えます。 ";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("教育について質問いたします。");
    expect(chunks[1]).toBe("子育て支援の充実が必要だと考えます。");
  });

  test("should filter out empty chunks", () => {
    const text =
      "教育について質問いたします。。。子育て支援の充実が必要だと考えます。";

    const chunks = chunk(text);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("教育について質問いたします。");
    expect(chunks[1]).toBe("子育て支援の充実が必要だと考えます。");
  });

  test("should handle long text and maintain reasonable chunk sizes", () => {
    const longText =
      "教育について質問いたします。".repeat(100) + "子育て支援について。";

    const chunks = chunk(longText);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
  });
});
