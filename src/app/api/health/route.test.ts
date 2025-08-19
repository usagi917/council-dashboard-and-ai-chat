import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("/api/health", () => {
  it("should return 200 status with ok: true", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
