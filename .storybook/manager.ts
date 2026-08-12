import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Envarly",
    brandUrl: "https://iray-tno.github.io/envarly/",
  }),
});
