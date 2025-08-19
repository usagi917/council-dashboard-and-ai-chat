import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("Home Page", () => {
  it("should render Hakusan Dashboard title", () => {
    render(<Home />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Hakusan Dashboard");
  });

  it("should have correct styling classes", () => {
    render(<Home />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("text-4xl", "font-bold", "text-gray-900", "mb-8");
  });
});
