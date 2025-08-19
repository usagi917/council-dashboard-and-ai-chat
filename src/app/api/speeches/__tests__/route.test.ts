import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

describe("/api/speeches", () => {
  it("should return paginated speeches with default parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/speeches");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.total).toBe("number");
    expect(data.items.length).toBeLessThanOrEqual(10); // default size
  });

  it("should handle custom page and size parameters", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/speeches?page=1&size=2"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items.length).toBeLessThanOrEqual(2);
  });

  it("should validate page parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/speeches?page=0"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("page");
  });

  it("should validate size parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/speeches?size=0"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("size");
  });

  it("should handle invalid parameter types", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/speeches?page=invalid"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
