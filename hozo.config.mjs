/** @type {import("@hozo/vite").HozoOptions} */
export const hozoOptions = {
  css: "src/index.css",
  preflight: false,
  // Tailwind still owns dynamic utilities during this incremental migration.
  content: { include: [], packages: [] },
};
