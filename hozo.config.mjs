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
