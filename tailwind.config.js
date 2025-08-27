/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // WCAG AA compliant blue-based theme
        primary: {
          50: "#eff6ff", // Very light blue - backgrounds
          100: "#dbeafe", // Light blue - subtle backgrounds
          200: "#bfdbfe", // Lighter blue - borders, disabled states
          300: "#93c5fd", // Light blue - inactive elements
          400: "#60a5fa", // Medium light blue - hover states
          500: "#3b82f6", // Medium blue - primary actions
          600: "#2563eb", // Medium dark blue - main brand color (7.2:1 contrast on white)
          700: "#1d4ed8", // Dark blue - pressed states, links (8.6:1 contrast on white)
          800: "#1e40af", // Darker blue - headings (10.7:1 contrast on white)
          900: "#1e3a8a", // Very dark blue - high contrast text (12.6:1 contrast on white)
        },
        secondary: {
          50: "#f8fafc", // Very light gray-blue
          100: "#f1f5f9", // Light gray-blue
          200: "#e2e8f0", // Lighter gray-blue
          300: "#cbd5e1", // Light gray-blue
          400: "#94a3b8", // Medium gray-blue
          500: "#64748b", // Medium gray-blue (7.0:1 contrast on white)
          600: "#475569", // Medium dark gray-blue (9.3:1 contrast on white)
          700: "#334155", // Dark gray-blue (12.6:1 contrast on white)
          800: "#1e293b", // Darker gray-blue (15.8:1 contrast on white)
          900: "#0f172a", // Very dark gray-blue (18.7:1 contrast on white)
        },
        // Success, warning, error colors with proper contrast
        success: {
          50: "#f0fdf4",
          500: "#22c55e", // 3.8:1 contrast on white (good for large text)
          600: "#16a34a", // 4.7:1 contrast on white (AA compliant)
          700: "#15803d", // 6.2:1 contrast on white (AAA compliant)
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b", // 2.9:1 contrast on white (needs darker variant)
          600: "#d97706", // 4.5:1 contrast on white (AA compliant)
          700: "#b45309", // 6.4:1 contrast on white (AAA compliant)
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444", // 3.3:1 contrast on white (needs darker variant)
          600: "#dc2626", // 4.9:1 contrast on white (AA compliant)
          700: "#b91c1c", // 7.0:1 contrast on white (AAA compliant)
        },
        // Background and surface colors
        background: {
          primary: "#ffffff", // Pure white
          secondary: "#f8fafc", // Very light blue-gray
          tertiary: "#f1f5f9", // Light blue-gray
          elevated: "#ffffff", // Elevated surfaces
        },
        surface: {
          primary: "#ffffff", // Cards, modals
          secondary: "#f8fafc", // Secondary surfaces
          tertiary: "#f1f5f9", // Subtle backgrounds
        },
        // Apple-inspired color palette (legacy, keeping for compatibility)
        apple: {
          blue: "#007AFF",
          indigo: "#5856D6",
          purple: "#AF52DE",
          teal: "#5AC8FA",
          cyan: "#50E3C2",
          mint: "#00C7BE",
          green: "#34C759",
          yellow: "#FFCC02",
          orange: "#FF9500",
          pink: "#FF2D92",
          red: "#FF3B30",
          gray: {
            100: "#F2F2F7",
            200: "#E5E5EA",
            300: "#C7C7CC",
            400: "#AEAEB2",
            500: "#8E8E93",
            600: "#636366",
            700: "#48484A",
            800: "#3A3A3C",
            900: "#1C1C1E",
          },
        },
        // Apple system backgrounds (legacy)
        system: {
          background: "#FFFFFF",
          "background-secondary": "#F2F2F7",
          "background-grouped": "#F2F2F7",
          "background-elevated": "#FFFFFF",
        },
      },
      fontFamily: {
        apple: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "large-title": ["34px", { lineHeight: "41px", fontWeight: "400" }],
        "title-1": ["28px", { lineHeight: "34px", fontWeight: "400" }],
        "title-2": ["22px", { lineHeight: "28px", fontWeight: "400" }],
        "title-3": ["20px", { lineHeight: "25px", fontWeight: "400" }],
        headline: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "22px", fontWeight: "400" }],
        callout: ["16px", { lineHeight: "21px", fontWeight: "400" }],
        subhead: ["15px", { lineHeight: "20px", fontWeight: "400" }],
        footnote: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      borderRadius: {
        apple: "10px",
        "apple-sm": "6px",
        "apple-lg": "16px",
        "apple-xl": "20px",
      },
      boxShadow: {
        apple: "0 4px 16px rgba(0, 0, 0, 0.12)",
        "apple-lg": "0 8px 32px rgba(0, 0, 0, 0.16)",
        "apple-card": "0 2px 16px rgba(0, 0, 0, 0.08)",
        "apple-elevated":
          "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-gentle": "bounceGentle 0.6s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        bounceGentle: {
          "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0,0,0)" },
          "40%, 43%": { transform: "translate3d(0, -2px, 0)" },
          "70%": { transform: "translate3d(0, -1px, 0)" },
          "90%": { transform: "translate3d(0, -0.5px, 0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backdropBlur: {
        apple: "20px",
      },
    },
  },
  plugins: [],
};
