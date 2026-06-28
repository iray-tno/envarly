# Envarly — Design Notes

Architecture decisions, security model, and data format specs. Not a tutorial; read this when you need to understand *why* something works the way it does.

---

## Architecture

```
src/                    React frontend (TypeScript)
  api.ts                Tauri command bridge — all invoke() calls live here
  App.tsx               Root: state, layout, dialog orchestration
  hooks/
    useStaged.ts        Staging area: Map<"Scope:name", StagedChange>; effectiveVars merge
    useUndoStack.ts     Generic undo/redo stack (stage-level Ctrl+Z/Y)
    useStagingHandlers.ts  Orchestrates all stage operations and undo pushes
    useEnvVars.ts       Registry polling + refresh
    useTheme.ts         Dark/light theme persistence
  lib/
    diff.ts             Pure snapshot diff — no side effects
    lint.ts             %VAR% reference lint; Windows built-in allowlist
    secrets.ts          Name-based + value-pattern secret detection (35+ formats)
  components/
    AppHeader/          Top bar: refresh, staged-change count, apply/discard, menu
    Sidebar/            Variable list, search, keyboard nav (ARIA listbox); M/A/D markers
    DetailPanel/        Edit → stage locally; local Ctrl+Z undo before staging
    PathEditor/         Drag-and-drop path list + per-entry validation + %VAR% lint
    ListEditor/         Generic sortable list editor (semicolon or comma separator)
    NewVarModal/        New variable creation dialog
    DiffPanel/          Unified diff view (external-change detection)
    SnapshotPanel/      Snapshot list (rendered in right sidebar)
    ImportExportPanel/  Import/Export wizard (rendered in modal)
    LicensesPanel/      Envarly MIT license + third-party OSS listing (rendered in modal)
    ui/                 Atomic components: Button, TextInput, Textarea, Badge, Modal, …

src-tauri/src/          Rust backend
  lib.rs                Entry point: CLI dispatch or Tauri run
  commands.rs           Tauri command handlers (thin — delegate to domain modules)
  env_store.rs          Registry read/write via winreg; EnvBackend trait + MemBackend for tests
  snapshot.rs           Snapshot save/list/restore + DPAPI encryption
  crypto.rs             DPAPI wrapper (protect/unprotect)
  export.rs             JSON + .reg import/export parsing
  cli.rs                Read-only CLI subcommands (clap)
  error.rs              EnvarlyError (thiserror)
```

### Frontend ↔ Backend boundary

All communication goes through `src/api.ts`. No `invoke()` call appears anywhere else in the frontend. This makes the boundary easy to audit, mock in tests, and replace if the IPC layer changes.

### Staging area

All edits are **staged locally** via `useStaged` before any registry write. The registry is never touched until the user clicks **Apply N staged changes** in the header.

1. User edits a value in DetailPanel → clicks **Stage** → `stageSet()` called, no IPC
2. Import → click "Stage N variables" → `stageImport()`, no IPC
3. Snapshot → click "Stage restore" → `stageSnapshot()`, no IPC
4. Sidebar shows **M** (modified) / **A** (added) / **D** (to-be-deleted) markers on staged items
5. User clicks **Apply N staged changes** (header) → unified diff modal → click **Apply to registry** → batch `api.setEnvVar`/`api.deleteEnvVar` + `WM_SETTINGCHANGE` broadcast → `clearStaged()`

`effectiveVars` (from `useStaged`) merges registry vars with staged changes; Sidebar and DetailPanel always display this merged view. Staged-deleted vars remain visible with a D marker so they can be unstaged.

### Local pre-stage undo

DetailPanel maintains a second, independent undo stack (`localHistory` ref) for edits that have not yet been staged. Ctrl+Z fires `handleDiscard`, which works at two granularities:

- **Text edits** — revert to the last structural checkpoint (drag/add/remove outcome)
- **Structural ops** (drag reorder, add, remove) — undo the operation itself, one step at a time

Pre-op and post-op values are both pushed as checkpoints when a structural change is confirmed (in `handleValueChange`, triggered after `onBeforeReorder`). This gives independent undo for interleaved text-then-drag sequences. The local stack is cleared whenever the selected variable changes or a change is staged.

---

## Security model

### Read-only until confirmed

The CLI (`get`, `list`, `export`) and Import preview **never write to the registry**. Imports are parsed into a preview structure that is staged locally; the user must click "Apply N staged changes" and confirm in the diff modal before any write happens. This is a hard invariant: no mutation escapes the `commands::set_env_var` / `commands::delete_env_var` handlers.

### Content Security Policy

`tauri.conf.json` uses a strict CSP. `default-src 'self'` is intentional — Envarly handles environment variables which may contain secrets (API keys, tokens), so no external resource loading is allowed.

### External links

Links to GitHub or other external URLs must use `tauri_plugin_opener::open_url()` (Rust) / `api.openUrl()` (TS), never `<a href>` with a bare URL. This keeps the webview's navigation policy intact.

### Secret detection

Name-based heuristics (`*_KEY`, `*_TOKEN`, `*_SECRET`, `*_PASSWORD`, …) plus value-pattern matching across 35+ token formats detect likely secrets. Detection runs client-side and is advisory only — it never blocks operations.

---

## Snapshot format

### File location

```
%LOCALAPPDATA%\Envarly\snapshots\<id>.snap
```

### Encryption

Each `.snap` file is a DPAPI-encrypted blob (`CryptProtectData`, `CRYPTPROTECT_UI_FORBIDDEN`). The plaintext is UTF-8 JSON. Only the Windows user account that created the snapshot on the same machine can decrypt it.

Non-Windows builds (CI) use a passthrough (no encryption) so tests can run without the DPAPI subsystem.

### Versioning

The JSON payload contains a `version` field. Current version is **1**.

| Version | Format | Notes |
|---------|--------|-------|
| 0 | Plaintext `.json` | Pre-encryption era; `.snap` filter ignores these files |
| 1 | DPAPI-encrypted `.snap` | Current |

**Migration policy:**

- Reading: check `meta.version` in `read_snap`. If `version == 0`, the file has the old extension (`.json`) and will never be listed since `list_snapshots_from` filters for `.snap`. No active migration needed.
- Writing: always write `SNAPSHOT_FORMAT_VERSION` (currently 1).
- On format change: increment `SNAPSHOT_FORMAT_VERSION`, add a migration branch in `read_snap` that converts the old shape to the current struct before returning it. Keep the constant and the version history table above up to date.

### Struct shape (v1)

```json
{
  "version": 1,
  "id": "20240615T120000Z",
  "createdAt": "2024-06-15T12:00:00Z",
  "label": "before npm install",
  "snapshot": {
    "user":   { "VAR": "value", ... },
    "system": { "PATH": "...", ... }
  }
}
```

---

## Data directories

| Purpose | Path |
|---------|------|
| Snapshots | `%LOCALAPPDATA%\Envarly\snapshots\` |

No other files are written. Settings are kept in Tauri's default store if added later.

---

## CLI mode

When launched with arguments, `try_run_cli()` intercepts before the GUI starts and exits the process after the command completes. Commands are strictly read-only — they call `env_store::read_all()` / `export::*` directly, never the write handlers.

```
envarly get <NAME> [--scope user|system]
envarly list [--scope user|system] [--json]
envarly export [--scope user|system] [--format json|reg] [--output <path>]
```

---

## Component sizing conventions

Spacing follows a 4px/8px grid. Tailwind class mapping:

| Intent | Classes |
|--------|---------|
| Button (sm) | `px-4 py-2.5 text-sm` |
| Button (md) | `px-5 py-3 text-sm font-medium` |
| IconButton | `p-1.5` |
| Input / Textarea | `px-4 py-2.5 text-sm` |
| Sidebar item | `px-4 py-2.5 rounded` |
| Badge | `px-3 py-1 text-xs` |

---

## Storybook

Deployed to GitHub Pages at `/envarly/storybook/` on push to `main`. The `/envarly/` root is reserved for a future landing page. Theme toggle (dark/light) uses `globalTypes` — the `backgrounds` addon is not used.
