import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock console to avoid test output pollution
vi.spyOn(console, "info").mockImplementation(() => {});

describe("/api/health", () => {
  it("should return 200 status with ok: true", async () => {
    const request = new NextRequest("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
