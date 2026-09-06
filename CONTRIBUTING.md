# Contributing

## Development flow

All changes go through a pull request — no direct commits to `main`.

```
git checkout -b feat/my-feature   # or fix/, chore/, docs/
# ...work...
git push -u origin feat/my-feature
# open PR on GitHub → CI must pass → merge
```

### When to open an issue first

| Situation | Issue needed? |
|---|---|
| New feature or significant change | Yes — design it before coding |
| Bug that needs investigation | Yes |
| Small fix, typo, dependency update | No — PR is enough |

### Branch naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Tooling, deps, config |
| `docs/` | Documentation only |
| `test/` | Tests only |

### Commit messages

Follow the conventional commits style already used in this repo:

```
feat: add snapshot comparison view
fix(sidebar): secrets chip not showing on first render
chore: update tauri to 2.x
```

### PR checklist

- [ ] `npm test` passes
- [ ] `npm run lint` passes (Biome)
- [ ] `npm run check-version` passes (if version files are touched)
- [ ] `cargo test` passes (if Rust changed)
- [ ] No direct registry writes added outside `commands/env.rs` / `apply_env_changes`
- [ ] New UI is keyboard-navigable and has appropriate ARIA roles

## Adding or updating translations

Envarly supports multiple languages using `react-i18next`. Translation resources live under `src/locales/`:

- `src/locales/<lang>/translation.json` — UI labels, tooltips, dialogs, and messages
- `src/locales/<lang>/descriptions.json` — Explanations for ~140 standard Windows environment variables

When adding a new language:
1. Create `src/locales/<lang>/` with `translation.json` and `descriptions.json`.
2. Register the language resource in `src/i18n.ts`.
3. Add the language option to the header language switcher in `src/components/AppHeader/LanguageMenu.tsx`.

## Setting up branch protection

GitHub → Settings → Branches → Add rule → `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass (select `test` workflow)
- ✅ Do not allow bypassing the above settings (optional — uncheck if you want admin override)
