import type { StorybookConfig } from "@storybook/react-vite";

const isProd = process.env.NODE_ENV === "production";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  viteFinal: (config) => {
    if (isProd) config.base = "/envarly/storybook/";
    return config;
  }
};

export default config;
