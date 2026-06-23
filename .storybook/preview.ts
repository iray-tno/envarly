import type { Preview } from "@storybook/react";
import "../src/index.css";

// Mock Tauri invoke for all stories
// @ts-ignore
window.__TAURI_INTERNALS__ = {};

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#0f1117" }],
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: { matchers: { color: /(bg|color)$/i } },
  },
};

export default preview;
