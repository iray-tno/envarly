#![cfg_attr(not(windows), allow(dead_code))]

#[cfg(windows)]
use crate::error::EnvarlyError;
#[cfg(windows)]
use crate::path_backend::{open_path_key, read_path_str, write_path_str};

// ── Pure helpers (testable without registry) ──────────────────────────────

/// Returns a new PATH string with `dir` appended, or `None` if already present.
pub fn compute_add(current: &str, dir: &str) -> Option<String> {
    let dir_lc = dir.to_lowercase();
    if current
        .split(';')
        .any(|p| p.trim().to_lowercase() == dir_lc)
    {
        return None;
    }
    Some(if current.trim_end_matches(';').is_empty() {
        dir.to_string()
    } else {
        format!("{};{}", current.trim_end_matches(';'), dir)
    })
}

/// Returns a new PATH string with `dir` removed, or `None` if not found.
pub fn compute_remove(current: &str, dir: &str) -> Option<String> {
    let dir_lc = dir.to_lowercase();
    let before: Vec<&str> = current.split(';').collect();
    let after: Vec<&str> = before
        .iter()
        .copied()
        .filter(|p| p.trim().to_lowercase() != dir_lc)
        .collect();
    if after.len() == before.len() {
        return None; // not present
    }
    Some(after.join(";"))
}

// ── check_command: does a name/path resolve via the effective PATH? ───────

const DEFAULT_PATHEXT: &str = ".COM;.EXE;.BAT;.CMD";

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandHit {
    pub directory: String,
    pub matched_file: String,
    pub source: String, // "User" | "System"
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase", tag = "status")]
pub enum FullPathStatus {
    Active,
    Shadowed {
        #[serde(rename = "shadowedBy")]
        shadowed_by: CommandHit,
    },
    NotOnEffectivePath,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckCommandResult {
    pub input: String,
    pub queried_name: String,
    pub had_extension: bool,
    pub hits: Vec<CommandHit>,
    pub full_path_status: Option<FullPathStatus>,
}

struct NormalizedInput {
    unquoted: String,
    basename: String,
    had_extension: bool,
    full_dir: Option<String>,
}

fn normalize_input(raw: &str) -> NormalizedInput {
    let trimmed = raw.trim();
    let unquoted = trimmed
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
        .unwrap_or(trimmed)
        .to_string();

    let (full_dir, basename) = match unquoted.rfind(['\\', '/']) {
        Some(idx) => (
            Some(unquoted[..idx].to_string()),
            unquoted[idx + 1..].to_string(),
        ),
        None => (None, unquoted.clone()),
    };

    let had_extension = basename.rfind('.').is_some();

    NormalizedInput {
        unquoted,
        basename,
        had_extension,
        full_dir,
    }
}

fn split_path_entries<'a>(
    raw: &'a str,
    source: &'static str,
) -> impl Iterator<Item = (&'a str, &'static str)> {
    raw.split(';')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(move |s| (s, source))
}

fn pathext_list(pathext_raw: &str) -> Vec<String> {
    let list: Vec<String> = pathext_raw
        .split(';')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect();
    if list.is_empty() {
        DEFAULT_PATHEXT.split(';').map(str::to_string).collect()
    } else {
        list
    }
}

fn normalize_dir_for_compare(dir: &str) -> String {
    dir.trim_end_matches(['\\', '/']).to_lowercase()
}

/// Pure matching engine — no registry/filesystem access, everything injected,
/// so it's fully unit-testable without touching the real PATH or disk.
pub fn check_command_with(
    raw_input: &str,
    user_path_raw: &str,
    system_path_raw: &str,
    pathext_raw: &str,
    expand_env: impl Fn(&str) -> String,
    path_exists: impl Fn(&str) -> bool,
) -> CheckCommandResult {
    let normalized = normalize_input(raw_input);

    let extensions: Vec<String> = if normalized.had_extension {
        vec![String::new()]
    } else {
        pathext_list(pathext_raw)
    };

    let mut hits: Vec<CommandHit> = Vec::new();

    for (dir, source) in split_path_entries(system_path_raw, "System")
        .chain(split_path_entries(user_path_raw, "User"))
    {
        let expanded_dir = expand_env(dir);
        let base = expanded_dir.trim_end_matches(['\\', '/']);
        for ext in &extensions {
            let candidate = format!("{base}\\{}{ext}", normalized.basename);
            if path_exists(&candidate) {
                hits.push(CommandHit {
                    directory: expanded_dir.clone(),
                    matched_file: format!("{}{ext}", normalized.basename),
                    source: source.to_string(),
                });
                break;
            }
        }
    }

    let full_path_status = normalized.full_dir.as_deref().map(|input_dir| {
        let input_dir_norm = normalize_dir_for_compare(input_dir);
        match hits
            .iter()
            .position(|h| normalize_dir_for_compare(&h.directory) == input_dir_norm)
        {
            Some(0) => FullPathStatus::Active,
            Some(_) => FullPathStatus::Shadowed {
                shadowed_by: hits[0].clone(),
            },
            None => FullPathStatus::NotOnEffectivePath,
        }
    });

    CheckCommandResult {
        input: normalized.unquoted,
        queried_name: normalized.basename,
        had_extension: normalized.had_extension,
        hits,
        full_path_status,
    }
}

// ── Public API ────────────────────────────────────────────────────────────

/// The install directory (directory containing the running exe).
pub fn install_dir() -> Option<std::path::PathBuf> {
    std::env::current_exe()
        .ok()?
        .parent()
        .map(|p| p.to_path_buf())
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PathStatus {
    pub install_dir: String,
    pub user_has_entry: bool,
    pub system_has_entry: bool,
}

/// Read whether the install dir is currently in User / System PATH.
#[cfg(windows)]
pub fn path_status() -> PathStatus {
    let dir = install_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default();
    let dir_lc = dir.to_lowercase();

    let user_has = open_path_key(true, false)
        .map(|k| {
            read_path_str(&k)
                .split(';')
                .any(|p| p.trim().to_lowercase() == dir_lc)
        })
        .unwrap_or(false);

    let sys_has = open_path_key(false, false)
        .map(|k| {
            read_path_str(&k)
                .split(';')
                .any(|p| p.trim().to_lowercase() == dir_lc)
        })
        .unwrap_or(false);

    PathStatus {
        install_dir: dir,
        user_has_entry: user_has,
        system_has_entry: sys_has,
    }
}

/// Returns the proposed new PATH value after adding the install dir, or `None`
/// if it is already present. `user = true` → User PATH, `false` → System PATH.
#[cfg(windows)]
pub fn propose_add(user: bool) -> Result<Option<String>, EnvarlyError> {
    let dir = install_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default();
    let key = open_path_key(user, false)?;
    let current = read_path_str(&key);
    Ok(compute_add(&current, &dir))
}

/// Checks whether `raw_input` (a command name or full exe path) would resolve
/// via the effective PATH (User + System merged, System first), and whether
/// it's shadowed by another same-named file earlier in the search order.
#[cfg(windows)]
pub fn check_command(raw_input: &str) -> Result<CheckCommandResult, EnvarlyError> {
    let user_raw = read_path_str(&open_path_key(true, false)?);
    let system_raw = read_path_str(&open_path_key(false, false)?);
    let pathext_raw = std::env::var("PATHEXT").unwrap_or_default();
    Ok(check_command_with(
        raw_input,
        &user_raw,
        &system_raw,
        &pathext_raw,
        crate::commands::path::expand_env_vars,
        crate::commands::path::dir_exists,
    ))
}

/// Remove the install dir from User PATH and/or System PATH (if elevated).
/// When `dry_run` is true, prints what would change without modifying the registry.
#[cfg(windows)]
pub fn cleanup_path(dry_run: bool) {
    let dir = match install_dir() {
        Some(d) => d.to_string_lossy().into_owned(),
        None => {
            eprintln!("path-cleanup: could not determine install directory");
            return;
        }
    };
    println!("install dir: {}", dir);

    for (user, label) in [(true, "User"), (false, "System")] {
        let Ok(key) = open_path_key(user, !dry_run) else {
            println!("{} PATH: (no access, skipping)", label);
            continue;
        };
        let current = read_path_str(&key);
        match compute_remove(&current, &dir) {
            None => println!("{} PATH: not present, nothing to remove", label),
            Some(new_val) => {
                if dry_run {
                    println!("{} PATH: would remove '{}'", label, dir);
                } else {
                    match write_path_str(&key, &new_val) {
                        Ok(()) => println!("{} PATH: removed '{}'", label, dir),
                        Err(e) => eprintln!("{} PATH: write failed: {}", label, e),
                    }
                }
            }
        }
    }

    if !dry_run {
        crate::env_store::broadcast_settings_change();
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_to_empty_path() {
        assert_eq!(compute_add("", r"C:\foo"), Some(r"C:\foo".into()));
    }

    #[test]
    fn add_appends_with_semicolon() {
        assert_eq!(
            compute_add(r"C:\a;C:\b", r"C:\foo"),
            Some(r"C:\a;C:\b;C:\foo".into())
        );
    }

    #[test]
    fn add_is_noop_if_present() {
        assert_eq!(compute_add(r"C:\a;C:\foo;C:\b", r"C:\foo"), None);
    }

    #[test]
    fn add_is_case_insensitive() {
        assert_eq!(compute_add(r"C:\Foo", r"C:\foo"), None);
    }

    #[test]
    fn add_trims_trailing_semicolons() {
        assert_eq!(compute_add(r"C:\a;", r"C:\b"), Some(r"C:\a;C:\b".into()));
    }

    #[test]
    fn remove_middle_entry() {
        assert_eq!(
            compute_remove(r"C:\a;C:\foo;C:\b", r"C:\foo"),
            Some(r"C:\a;C:\b".into())
        );
    }

    #[test]
    fn remove_only_entry() {
        assert_eq!(compute_remove(r"C:\foo", r"C:\foo"), Some(String::new()));
    }

    #[test]
    fn remove_is_noop_if_absent() {
        assert_eq!(compute_remove(r"C:\a;C:\b", r"C:\foo"), None);
    }

    #[test]
    fn remove_is_case_insensitive() {
        assert_eq!(compute_remove(r"C:\FOO", r"C:\foo"), Some(String::new()));
    }

    // ── check_command_with ─────────────────────────────────────────────

    fn fake_exists(existing: &[&str]) -> impl Fn(&str) -> bool {
        let existing_lc: Vec<String> = existing.iter().map(|s| s.to_lowercase()).collect();
        move |candidate: &str| existing_lc.contains(&candidate.to_lowercase())
    }

    fn no_expand(s: &str) -> String {
        s.to_string()
    }

    const PATHEXT: &str = ".COM;.EXE;.BAT;.CMD";

    #[test]
    fn check_finds_bare_name_via_pathext() {
        let exists = fake_exists(&[r"C:\Tools\node.exe"]);
        let result = check_command_with("node", "", r"C:\Tools", PATHEXT, no_expand, exists);
        assert_eq!(result.hits.len(), 1);
        assert_eq!(result.hits[0].directory, r"C:\Tools");
        assert_eq!(result.hits[0].matched_file, "node.EXE");
        assert_eq!(result.hits[0].source, "System");
        assert!(result.full_path_status.is_none());
    }

    #[test]
    fn check_collects_all_hits_system_first() {
        let exists = fake_exists(&[r"C:\Sys\node.exe", r"C:\User\node.exe"]);
        let result = check_command_with("node", r"C:\User", r"C:\Sys", PATHEXT, no_expand, exists);
        assert_eq!(result.hits.len(), 2);
        assert_eq!(result.hits[0].directory, r"C:\Sys");
        assert_eq!(result.hits[0].source, "System");
        assert_eq!(result.hits[1].directory, r"C:\User");
        assert_eq!(result.hits[1].source, "User");
    }

    #[test]
    fn check_with_extension_skips_pathext_and_requires_exact_match() {
        // Dir has foo.bat but not foo.exe — input "foo.exe" should not match it.
        let exists = fake_exists(&[r"C:\Tools\foo.bat"]);
        let result = check_command_with("foo.exe", "", r"C:\Tools", PATHEXT, no_expand, exists);
        assert!(result.hits.is_empty());
        assert!(result.had_extension);
    }

    #[test]
    fn check_with_extension_matches_exact_file() {
        let exists = fake_exists(&[r"C:\Tools\foo.exe"]);
        let result = check_command_with("foo.exe", "", r"C:\Tools", PATHEXT, no_expand, exists);
        assert_eq!(result.hits.len(), 1);
        assert_eq!(result.hits[0].matched_file, "foo.exe");
    }

    #[test]
    fn check_unquotes_full_path_and_splits_on_backslash() {
        let exists = fake_exists(&[r"C:\Tools\node.exe"]);
        let result = check_command_with(
            "\"C:\\Tools\\node.exe\"",
            "",
            r"C:\Tools",
            PATHEXT,
            no_expand,
            exists,
        );
        assert_eq!(result.input, r"C:\Tools\node.exe");
        assert_eq!(result.queried_name, "node.exe");
        assert!(matches!(
            result.full_path_status,
            Some(FullPathStatus::Active)
        ));
    }

    #[test]
    fn check_splits_full_path_on_forward_slash() {
        let exists = fake_exists(&["C:/Tools/node.exe"]);
        let result = check_command_with(
            "C:/Tools/node.exe",
            "",
            "C:/Tools",
            PATHEXT,
            no_expand,
            exists,
        );
        assert_eq!(result.queried_name, "node.exe");
        assert!(result.full_path_status.is_some());
    }

    #[test]
    fn check_full_path_matching_first_hit_is_active() {
        let exists = fake_exists(&[r"C:\Sys\node.exe", r"C:\User\node.exe"]);
        let result = check_command_with(
            r"C:\Sys\node.exe",
            r"C:\User",
            r"C:\Sys",
            PATHEXT,
            no_expand,
            exists,
        );
        assert!(matches!(
            result.full_path_status,
            Some(FullPathStatus::Active)
        ));
    }

    #[test]
    fn check_full_path_matching_later_hit_is_shadowed() {
        let exists = fake_exists(&[r"C:\Sys\node.exe", r"C:\User\node.exe"]);
        let result = check_command_with(
            r"C:\User\node.exe",
            r"C:\User",
            r"C:\Sys",
            PATHEXT,
            no_expand,
            exists,
        );
        match result.full_path_status {
            Some(FullPathStatus::Shadowed { shadowed_by }) => {
                assert_eq!(shadowed_by.directory, r"C:\Sys");
            }
            other => panic!("expected Shadowed, got {other:?}"),
        }
    }

    #[test]
    fn check_full_path_not_on_effective_path() {
        // A different node.exe exists elsewhere on PATH, but not at the given path.
        let exists = fake_exists(&[r"C:\Sys\node.exe"]);
        let result = check_command_with(
            r"C:\Elsewhere\node.exe",
            "",
            r"C:\Sys",
            PATHEXT,
            no_expand,
            exists,
        );
        assert_eq!(result.hits.len(), 1);
        assert!(matches!(
            result.full_path_status,
            Some(FullPathStatus::NotOnEffectivePath)
        ));
    }

    #[test]
    fn check_empty_input_yields_no_hits_and_no_panic() {
        let exists = fake_exists(&[]);
        let result = check_command_with("", "", r"C:\Sys", PATHEXT, no_expand, exists);
        assert!(result.hits.is_empty());
        assert!(result.full_path_status.is_none());
    }

    #[test]
    fn check_filters_empty_path_segments() {
        let exists = fake_exists(&[r"C:\Sys\node.exe"]);
        let result = check_command_with("node", "", ";C:\\Sys;;", PATHEXT, no_expand, exists);
        assert_eq!(result.hits.len(), 1);
        assert_eq!(result.hits[0].directory, r"C:\Sys");
    }

    #[test]
    fn check_falls_back_to_default_pathext_when_missing() {
        let exists = fake_exists(&[r"C:\Sys\node.exe"]);
        let result = check_command_with("node", "", r"C:\Sys", "", no_expand, exists);
        assert_eq!(result.hits.len(), 1);
        assert_eq!(result.hits[0].matched_file, "node.EXE");
    }

    #[test]
    fn check_nonexistent_dir_contributes_no_hits() {
        let exists = fake_exists(&[r"C:\Real\node.exe"]);
        let result = check_command_with(
            "node",
            "",
            r"C:\DoesNotExist;C:\Real",
            PATHEXT,
            no_expand,
            exists,
        );
        assert_eq!(result.hits.len(), 1);
        assert_eq!(result.hits[0].directory, r"C:\Real");
    }

    #[test]
    fn check_full_path_comparison_ignores_case_and_trailing_backslash() {
        let exists = fake_exists(&[r"C:\Sys\node.exe"]);
        let result = check_command_with(
            r"c:\SYS\NODE.EXE",
            "",
            r"C:\Sys\",
            PATHEXT,
            no_expand,
            exists,
        );
        assert!(matches!(
            result.full_path_status,
            Some(FullPathStatus::Active)
        ));
    }
}
