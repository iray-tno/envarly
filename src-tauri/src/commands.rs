use crate::env_store::{self, EnvSnapshot, EnvVar, VarScope};
use crate::error::EnvarlyError;
use crate::snapshot::{self, SnapshotMeta};

#[tauri::command]
pub fn get_env_vars() -> Result<Vec<EnvVar>, EnvarlyError> {
    env_store::read_all()
}

#[tauri::command]
pub fn get_registry_snapshot() -> Result<crate::env_store::EnvSnapshot, EnvarlyError> {
    env_store::read_snapshot()
}

#[tauri::command]
pub fn set_env_var(name: String, value: String, scope: VarScope) -> Result<(), EnvarlyError> {
    env_store::write_var(&name, &value, &scope)
}

#[tauri::command]
pub fn delete_env_var(name: String, scope: VarScope) -> Result<(), EnvarlyError> {
    env_store::delete_var(&name, &scope)
}

#[tauri::command]
pub fn create_snapshot(label: String) -> Result<SnapshotMeta, EnvarlyError> {
    let snap = env_store::read_snapshot()?;
    snapshot::save_snapshot(snap, &label)
}

#[tauri::command]
pub fn list_snapshots() -> Result<Vec<SnapshotMeta>, EnvarlyError> {
    snapshot::list_snapshots()
}

#[tauri::command]
pub fn delete_snapshot(id: String) -> Result<(), EnvarlyError> {
    snapshot::delete_snapshot(&id)
}

#[tauri::command]
pub fn restore_snapshot(id: String) -> Result<(), EnvarlyError> {
    let snaps = snapshot::list_snapshots()?;
    let target = snaps
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| EnvarlyError::Snapshot(format!("Snapshot '{id}' not found")))?;

    for (name, value) in &target.snapshot.user {
        env_store::write_var(name, value, &VarScope::User)?;
    }
    for (name, value) in &target.snapshot.system {
        env_store::write_var(name, value, &VarScope::System)?;
    }
    Ok(())
}

/// Return the current registry state as JSON or .reg text. Read-only.
#[tauri::command]
pub fn export_vars(scope: String, format: String) -> Result<String, EnvarlyError> {
    let snapshot = env_store::read_snapshot()?;
    Ok(match format.as_str() {
        "reg" => crate::export::to_reg(&snapshot, &scope),
        _ => crate::export::to_json(&snapshot, &scope),
    })
}

/// Parse an exported file and return its contents as a snapshot. Does NOT touch the registry.
#[tauri::command]
pub fn parse_import(content: String, format: String) -> Result<EnvSnapshot, EnvarlyError> {
    match format.as_str() {
        "reg" => crate::export::parse_reg(&content),
        _ => crate::export::parse_json(&content),
    }
}

#[tauri::command]
pub fn validate_paths(paths: Vec<String>) -> Vec<bool> {
    paths
        .iter()
        .map(|p| std::path::Path::new(&expand_env_vars(p)).exists())
        .collect()
}

pub(crate) fn expand_env_vars(s: &str) -> String {
    let mut result = s.to_string();
    while let Some(start) = result.find('%') {
        if let Some(end) = result[start + 1..].find('%') {
            let var_name = &result[start + 1..start + 1 + end];
            if let Ok(val) = std::env::var(var_name) {
                result = format!(
                    "{}{}{}",
                    &result[..start],
                    val,
                    &result[start + 1 + end + 1..]
                );
            } else {
                break;
            }
        } else {
            break;
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expand_no_vars() {
        assert_eq!(expand_env_vars("C:\\Windows\\System32"), "C:\\Windows\\System32");
    }

    #[test]
    fn expand_known_var() {
        std::env::set_var("_TEST_EXPAND_VAR", "hello");
        let result = expand_env_vars("%_TEST_EXPAND_VAR%\\sub");
        assert_eq!(result, "hello\\sub");
        std::env::remove_var("_TEST_EXPAND_VAR");
    }

    #[test]
    fn expand_unknown_var_passthrough() {
        // Unknown vars are left unexpanded (loop breaks)
        let input = "%DOES_NOT_EXIST_ZZZ%";
        let result = expand_env_vars(input);
        assert_eq!(result, input);
    }

    #[test]
    fn validate_paths_existing() {
        // System32 should always exist on Windows CI
        let results = validate_paths(vec!["C:\\Windows".to_string()]);
        // On non-Windows CI this might be false; guard the assertion
        if cfg!(target_os = "windows") {
            assert_eq!(results, vec![true]);
        }
    }

    #[test]
    fn validate_paths_nonexistent() {
        let results = validate_paths(vec!["C:\\ZZZ_DOES_NOT_EXIST_PATH_XYZ".to_string()]);
        assert_eq!(results, vec![false]);
    }

    #[test]
    fn validate_paths_empty_list() {
        let results = validate_paths(vec![]);
        assert!(results.is_empty());
    }
}
