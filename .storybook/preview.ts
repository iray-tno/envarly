import type { Preview } from "@storybook/react";
import "../src/index.css";

// Mock Tauri invoke for all stories
// @ts-ignore
window.__TAURI_INTERNALS__ = {};

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0f1117" },
        { name: "light", value: "#ffffff" },
      ],
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: { matchers: { color: /(bg|color)$/i } },
  },
  decorators: [
    (Story, context) => {
      const bg = context.globals.backgrounds?.value;
      const isLight = bg === "#ffffff";
      document.documentElement.classList.toggle("light", isLight);
      document.documentElement.classList.toggle("dark", !isLight);
      return Story();
    },
  ],
};

export default preview;
