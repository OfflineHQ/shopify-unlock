import defaultTheme from "tailwindcss/defaultTheme";
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "../../src/**/*.{ts,tsx}",
    "../offline-connect/**/*.liquid",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "offline-",
  theme: {
    columns: replaceRem(defaultTheme.columns),
    spacing: replaceRem(defaultTheme.spacing),
    borderRadius: replaceRem(defaultTheme.borderRadius),
    fontSize: replaceRem(defaultTheme.fontSize),
    lineHeight: replaceRem(defaultTheme.lineHeight),
    maxWidth: replaceRem(defaultTheme.maxWidth),
    extend: {
      fontFamily: {
        body: "var(--font-body-family)",
        heading: "var(--font-heading-family)",
      },
      colors: {
        text: "rgba(var(--color-base-text), <alpha-value>)",
        accent1: "rgba(var(--color-base-accent-1), <alpha-value>)",
        accent2: "rgba(var(--color-base-accent-2), <alpha-value>)",
        background1: "rgba(var(--color-base-background-1), <alpha-value>)",
        background2: "rgba(var(--color-base-background-2), <alpha-value>)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      screens: {
        md: "750px",
        lg: "990px",
        xl: "1400px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  corePlugins: {
    preflight: false, // important ! avoid overlapping with storefront css
  },
  plugins: [require("tailwindcss-animate")],
};

/**
 * Recursively replace all `rem` values from root font-size 16px to root font-size `10px`.
 *
 * @template T
 * @param {T} value value to convert, all rem values are assumed to be based on a root font-size of `16px`
 * @returns {T} value with all rem values converted to a root font-size of `10px`
 */
function replaceRem(value: any) {
  if (value == null) {
    return value;
  } else if (Array.isArray(value)) {
    return value.map(replaceRem);
  } else if (typeof value === "object") {
    return Object.entries(value).reduce(
      (prev, [key, value]) => ({ ...prev, [key]: replaceRem(value) }),
      {},
    );
  } else if (typeof value === "function") {
    return (...args) => replaceRem(value(...args));
  } else if (typeof value === "string" && value.endsWith("rem")) {
    const originalValue = parseFloat(value.replace("rem", ""));
    return `${(originalValue * 16) / 10}rem`;
  }

  return value;
}
