import { describe, it, expect } from "vitest";

// Color contrast utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

describe("Color Contrast Compliance", () => {
  // WCAG AA requires minimum 4.5:1 contrast ratio for normal text
  // WCAG AAA requires minimum 7:1 contrast ratio for normal text
  // Large text (18pt or 14pt bold) requires minimum 3:1 for AA and 4.5:1 for AAA

  const colors = {
    // Our blue theme colors
    primary: {
      50: "#eff6ff", // Very light blue
      100: "#dbeafe", // Light blue
      200: "#bfdbfe", // Lighter blue
      300: "#93c5fd", // Light blue
      400: "#60a5fa", // Medium light blue
      500: "#3b82f6", // Medium blue (primary)
      600: "#2563eb", // Medium dark blue
      700: "#1d4ed8", // Dark blue
      800: "#1e40af", // Darker blue
      900: "#1e3a8a", // Very dark blue
    },
    // Background colors
    background: {
      white: "#ffffff",
      gray50: "#f9fafb",
      gray100: "#f3f4f6",
      gray900: "#111827",
    },
  };

  it("should meet AA contrast requirements for primary blue on white backgrounds", () => {
    const whiteBackground = colors.background.white;

    // Test primary blue variants against white
    const primaryOnWhite = getContrastRatio(
      colors.primary[600],
      whiteBackground
    );
    expect(primaryOnWhite).toBeGreaterThanOrEqual(4.5); // AA normal text

    const mediumBlueOnWhite = getContrastRatio(
      colors.primary[700],
      whiteBackground
    );
    expect(mediumBlueOnWhite).toBeGreaterThanOrEqual(4.5); // AA normal text

    const darkBlueOnWhite = getContrastRatio(
      colors.primary[800],
      whiteBackground
    );
    expect(darkBlueOnWhite).toBeGreaterThanOrEqual(7.0); // AAA normal text
  });

  it("should meet AA contrast requirements for white text on blue backgrounds", () => {
    const whiteText = colors.background.white;

    // Test white text on blue backgrounds
    const whiteOnPrimary = getContrastRatio(whiteText, colors.primary[600]);
    expect(whiteOnPrimary).toBeGreaterThanOrEqual(4.5); // AA normal text

    const whiteOnDarkBlue = getContrastRatio(whiteText, colors.primary[700]);
    expect(whiteOnDarkBlue).toBeGreaterThanOrEqual(4.5); // AA normal text
  });

  it("should meet contrast requirements for interactive elements", () => {
    // Buttons and interactive elements should have good contrast
    const buttonBackground = colors.primary[600]; // #2563eb
    const buttonText = colors.background.white;

    const buttonContrast = getContrastRatio(buttonText, buttonBackground);
    expect(buttonContrast).toBeGreaterThanOrEqual(4.5); // AA requirement
  });

  it("should meet contrast requirements for links and accent colors", () => {
    // Links should be distinguishable and accessible
    const linkColor = colors.primary[700]; // #1d4ed8
    const backgroundColor = colors.background.white;

    const linkContrast = getContrastRatio(linkColor, backgroundColor);
    expect(linkContrast).toBeGreaterThanOrEqual(4.5); // AA requirement
  });

  it("should provide sufficient contrast for secondary text", () => {
    // Secondary text (gray-600 equivalent in our blue theme)
    const secondaryTextColor = colors.primary[800]; // Darker blue for secondary text
    const backgroundColor = colors.background.white;

    const secondaryContrast = getContrastRatio(
      secondaryTextColor,
      backgroundColor
    );
    expect(secondaryContrast).toBeGreaterThanOrEqual(4.5); // AA requirement
  });
});
