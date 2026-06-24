# Envarly

Windows environment variable manager built with Tauri v2, React, TypeScript, and Rust.

## Features

- **2-pane UI** — sidebar variable list with search/filter, detail editor on the right
- **PATH editor** — drag-and-drop reordering, invalid path detection, per-entry validation
- **Snapshot / time-travel** — save named snapshots, restore to any previous state
- **Diff detection** — detects registry changes made by other processes while Envarly is open; shows a diff with selective apply (accept or revert per entry)
- **Import / Export** — read/write `.json` and `.reg` formats; import shows a preview before writing anything
- **CLI mode** — read-only subcommands (`get`, `list`, `export`) run directly from a terminal; no GUI launched
- **WM\_SETTINGCHANGE broadcast** — running apps pick up changes without a restart

## Stack

| Layer | Tech |
|---|---|
| Desktop shell | Tauri v2 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Rust backend | winreg, clap, serde\_json, chrono, thiserror |
| Linter / formatter | Biome |
| Tests | Vitest + @testing-library/react |
| Component explorer | Storybook 8 |
| Runtime versions | mise (Node 22, Rust stable) |

## Prerequisites

- [mise](https://mise.jdx.dev/) — installs the correct Node and Rust versions automatically
- Windows 10 / 11 (registry access required)

## Getting started

```sh
mise install          # install Node 22 and Rust stable
npm install           # install JS dependencies
cd src-tauri && cargo fetch && cd ..  # prefetch Rust crates
```

## Development

```sh
npm run tauri dev     # start Tauri + Vite dev server (hot-reload)
```

## Testing

```sh
npm test              # Vitest in watch mode
npm run coverage      # coverage report (V8)
cd src-tauri && cargo test   # Rust unit tests
```

## Storybook

```sh
npm run storybook     # http://localhost:6006
```

## Lint & format

```sh
npm run lint          # Biome check
npm run lint:fix      # auto-fix
npm run format        # format only
```

## Build

```sh
npm run tauri build   # produces installer in src-tauri/target/release/bundle/
```

## CLI usage

> CLI subcommands work in debug builds or when launched from an existing terminal in release.
> In release GUI builds, stdout is not attached to the console (Windows subsystem).

```sh
# Print a variable's value
envarly get PATH
envarly get JAVA_HOME --scope user

# List all variables
envarly list
envarly list --scope system --format json

# Export to file or stdout (read-only — does not modify the registry)
envarly export --format json --output backup.json
envarly export --format reg  --output backup.reg
envarly export --format json | jq '.user.PATH'
```

## Import / Export (GUI)

Open the **Import / Export** tab in the app.

- **Export** — choose scope (All / User / System) and format (`.json` / `.reg`), then download.
- **Import** — upload a file or paste its contents, click **Parse** to preview all variables, check the ones to apply, then click **Apply Selected**. The registry is not touched until you explicitly apply.

## Project structure

```
envarly/
├── src/                        # React frontend
│   ├── api.ts                  # Tauri invoke wrappers
│   ├── types.ts                # Shared TypeScript types
│   ├── lib/
│   │   ├── cn.ts               # clsx + tailwind-merge helper
│   │   └── diff.ts             # Pure diff computation (no side effects)
│   └── components/
│       ├── Sidebar/            # Variable list with search & scope filter
│       ├── DetailPanel/        # Variable editor (plain text + PATH editor)
│       ├── PathEditor/         # Drag-and-drop PATH entry editor
│       ├── SnapshotPanel/      # Snapshot list, create, restore
│       ├── DiffPanel/          # External-change diff with selective apply
│       └── ImportExportPanel/  # File import / export UI
├── src-tauri/src/              # Rust backend
│   ├── main.rs                 # Entry point; CLI dispatch then GUI launch
│   ├── lib.rs                  # Tauri builder + command registration
│   ├── cli.rs                  # clap CLI (get / list / export)
│   ├── commands.rs             # Tauri commands
│   ├── env_store.rs            # Registry read/write + WM_SETTINGCHANGE
│   ├── export.rs               # JSON and .reg serialisation / parsing
│   ├── snapshot.rs             # Snapshot persistence (%LOCALAPPDATA%\Envarly)
│   └── error.rs                # EnvarlyError (thiserror + Serialize)
├── .mise.toml                  # Tool versions (Node 22, Rust stable)
├── biome.json                  # Lint / format config
└── vitest.config.ts            # Test config
```

## Snapshots

Snapshots are stored as JSON files under `%LOCALAPPDATA%\Envarly\snapshots\`. Each file contains the full user and system environment at the time of the snapshot. They can be listed, restored, or deleted from within the app.

## Architecture notes

**Diff detection** uses a two-layer approach:

1. `computeDiff()` in `src/lib/diff.ts` — pure function comparing two `EnvSnapshot` objects; returns structured `DiffEntry[]` (added / removed / changed, with scope)
2. `react-diff-viewer-continued` — visual text diff for long values like PATH (split on `;`)

The baseline snapshot is captured on app mount. Every Refresh call re-reads the registry and compares; if the snapshots differ, a **Changes** tab appears automatically.

**Import safety**: `parse_import` (Rust) only deserialises the file and returns a snapshot struct. It never calls `write_var`. Registry writes happen only when the user clicks Apply in the frontend.
