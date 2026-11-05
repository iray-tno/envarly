/** @type {import("@hozo/vite").HozoOptions} */
export const hozoOptions = {
  css: "src/index.css",
  preflight: false,
  // Tailwind still owns dynamic utilities during this incremental migration.
  content: { include: [], packages: [] },
  // `cn` resolves conflicts with tailwind-merge, so it must stay a runtime
  // call: read as a plain join, its static base compiles to an unlayered
  // class that a caller's `className` can't override (iray-tno/hozo#1668).
  // Hozo after 0.4.0 stops reading tailwind-merge helpers itself (#1675);
  // drop this then. `module` is the specifier as callers write it.
  classHelpers: [
    { module: "../../lib/cn", name: "cn", recognize: false },
    { module: "../../../lib/cn", name: "cn", recognize: false },
  ],
};

// Modules Hozo's compiler imports into transformed components. Vite's
// dependency scan runs before that transform, so it finds them mid-run
// and reloads the page, which fails Storybook's browser tests on a cold
// cache. Pre-bundle them up front (iray-tno/hozo#1698; drop once the
// plugin does this itself).
export const hozoOptimizeDeps = ["@hozo/core/generated/text-input-dom-props"];
