import type { StorybookConfig } from "@storybook/react-vite";

const isProd = process.env.NODE_ENV === "production";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: { autodocs: "tag" },
  viteFinal: (config) => {
    if (isProd) config.base = "/envarly/";
    return config;
  },
};

export default config;
