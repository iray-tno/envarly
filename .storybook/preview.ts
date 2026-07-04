import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

// Mock Tauri invoke for all stories
// @ts-ignore
window.__TAURI_INTERNALS__ = {};

const BG: Record<string, string> = {
  dark: "#0f1117",
  light: "#f5f5f5",
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "moon",
        items: [
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "light", title: "Light", icon: "sun" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "dark",
  },
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: { matchers: { color: /(bg|color)$/i } },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "dark";
      document.documentElement.classList.toggle("light", theme === "light");
      document.documentElement.classList.toggle("dark", theme !== "light");
      document.body.style.background = BG[theme] ?? BG.dark;
      return Story();
    },
  ],
};

export default preview;
