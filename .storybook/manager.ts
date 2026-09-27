import React from "react";
import { addons, types } from "storybook/manager-api";
import { create } from "storybook/theming";

function getLpUrl(): string {
  if (typeof window !== "undefined") {
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && ref.pathname.startsWith("/envarly/")) {
          if (!ref.pathname.includes("/storybook") && !ref.pathname.includes("/reports")) {
            return ref.pathname;
          }
        }
      }
    } catch {
      // fallback
    }
    if (window.location.pathname.startsWith("/envarly/")) {
      return "/envarly/";
    }
  }
  return "https://iray-tno.github.io/envarly/";
}

const lpUrl = getLpUrl();

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "← Back to Envarly",
    brandUrl: lpUrl,
    brandTarget: "_self",
  }),
});

addons.register("envarly/toolbar", () => {
  addons.add("envarly/toolbar/back", {
    type: types.TOOL,
    title: "Back to Envarly LP",
    match: () => true,
    render: () =>
      React.createElement(
        "a",
        {
          href: lpUrl,
          title: "Back to Envarly LP",
          target: "_self",
          className: "envarly-back-tool",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            const url = getLpUrl();
            e.currentTarget.href = url;
          },
        },
        "← Back to Envarly",
      ),
  });
});
