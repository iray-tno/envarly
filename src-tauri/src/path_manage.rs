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
}
