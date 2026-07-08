import type { Preview } from "@storybook/react-vite";
import { create } from "storybook/theming/create";
import "../src/index.css";
import "../src/i18n";
import "./preview.css";

// Mock Tauri invoke for all stories
// @ts-expect-error
window.__TAURI_INTERNALS__ = {};

const BG: Record<string, string> = {
  dark: "#0f1117",
  light: "#ffffff",
};

const docsTheme = create({
  base: "dark",
  appBg: "#0f1117",
  appContentBg: "#161b22",
  appPreviewBg: "#0f1117",
  appBorderColor: "#69788c",
  appBorderRadius: 4,
  barBg: "#161b22",
  barTextColor: "#99a3ad",
  barSelectedColor: "#e6edf3",
  barHoverColor: "#e6edf3",
  colorPrimary: "#58a6ff",
  colorSecondary: "#79bbff",
  inputBg: "#1c2333",
  inputBorder: "#69788c",
  inputTextColor: "#e6edf3",
  textColor: "#e6edf3",
  textInverseColor: "#0f1117",
  textMutedColor: "#99a3ad",
});

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
    docs: {
      theme: docsTheme,
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "dark";
      document.documentElement.classList.toggle("light", theme === "light");
      document.documentElement.classList.toggle("dark", theme !== "light");
      document.body.classList.toggle("light", theme === "light");
      document.body.classList.toggle("dark", theme !== "light");
      document.body.style.background = BG[theme] ?? BG.dark;
      return Story();
    },
  ],
};

export default preview;
