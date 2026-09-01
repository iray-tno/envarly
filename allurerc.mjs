// Config for `npx allure generate` (Allure Report 3), used by the Pages
// workflow to build the CI test report published at /envarly/reports/.
// Auto-discovered by the CLI from the working directory it's run from
// (the repo root) — no --config flag needed.
export default {
  name: 'Envarly — Test Reports',
  // Accumulates one entry per run across CI invocations so the report can
  // show pass/fail trend and regression status per test, not just a single
  // isolated snapshot. The workflow fetches the previous run's copy of this
  // file from the live site before generating, and republishes the updated
  // copy after — see .github/workflows/pages.yml.
  historyPath: './allure-history/allure-history.jsonl',
  appendHistory: true,
  historyLimit: 30,
};
