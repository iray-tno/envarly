use crate::env_store::{self, EnvSnapshot, EnvVar, VarScope};
use crate::error::EnvarlyError;
use crate::path_manage;
use crate::snapshot::{self, SnapshotMeta};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CustomExportVar {
    pub name: String,
    pub value: String,
    pub scope: String,
}

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

/// Returns true when the process has write access to HKLM (admin / elevated).
#[tauri::command]
pub fn is_elevated() -> bool {
    env_store::is_elevated()
}

/// Spawn a new elevated instance via UAC and exit the current process.
#[tauri::command]
pub fn restart_as_admin(app: tauri::AppHandle) -> Result<(), EnvarlyError> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let exe = std::env::current_exe().map_err(EnvarlyError::Registry)?;
        std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-WindowStyle",
                "Hidden",
                "-Command",
                &format!("Start-Process '{}' -Verb RunAs", exe.display()),
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(EnvarlyError::Registry)?;
        app.exit(0);
    }
    #[cfg(not(target_os = "windows"))]
    let _ = app;
    Ok(())
}

/// Open a native save dialog and write the exported content to the chosen file.
/// Returns the saved file path, or None if the user cancelled.
#[tauri::command]
pub async fn export_vars(
    app: tauri::AppHandle,
    scope: String,
    format: String,
) -> Result<Option<String>, EnvarlyError> {
    use tauri_plugin_dialog::{DialogExt, FilePath};

    let snapshot = env_store::read_snapshot()?;
    let (content, ext, default_stem, filter_name) = match format.as_str() {
        "reg"     => (crate::export::to_reg(&snapshot, &scope),     "reg",      "envarly",         "Registry files"),
        "ps1"     => (crate::export::to_ps1(&snapshot, &scope),     "ps1",      "envarly",         "PowerShell Script"),
        "dsc_v2"  => (crate::export::to_dsc_v2(&snapshot, &scope),  "ps1",      "envarly-dsc",     "PowerShell DSC Configuration"),
        "dsc_v3"  => (crate::export::to_dsc_v3(&snapshot, &scope),  "dsc.yaml", "envarly-dsc3",    "DSC v3 Configuration"),
        "ansible" => (crate::export::to_ansible(&snapshot, &scope), "yml",      "envarly-ansible", "Ansible Playbook"),
        _         => (crate::export::to_json(&snapshot, &scope),    "json",     "envarly",         "JSON files"),
    };

    let default_name = format!(
        "{}-{}.{}",
        default_stem,
        chrono::Local::now().format("%Y%m%d"),
        ext
    );

    let path = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(filter_name, &[ext])
        .blocking_save_file();

    match path {
        Some(FilePath::Path(p)) => {
            std::fs::write(&p, content.as_bytes()).map_err(EnvarlyError::Registry)?;
            Ok(Some(p.to_string_lossy().into_owned()))
        }
        _ => Ok(None), // cancelled
    }
}

/// Parse an exported file and return its contents as a snapshot. Does NOT touch the registry.
#[tauri::command]
pub fn parse_import(content: String, format: String) -> Result<EnvSnapshot, EnvarlyError> {
    match format.as_str() {
        "reg" => crate::export::parse_reg(&content),
        _ => crate::export::parse_json(&content),
    }
}

/// Export a caller-supplied list of variables (name+value+scope) to a user-chosen file.
/// Values come from the frontend so no extra registry read is needed.
#[tauri::command]
pub async fn export_custom(
    app: tauri::AppHandle,
    vars: Vec<CustomExportVar>,
    format: String,
) -> Result<Option<String>, EnvarlyError> {
    use std::collections::HashMap;
    use tauri_plugin_dialog::{DialogExt, FilePath};

    let mut snapshot = EnvSnapshot {
        user: HashMap::new(),
        system: HashMap::new(),
    };
    for v in &vars {
        match v.scope.as_str() {
            "User"   => { snapshot.user.insert(v.name.clone(), v.value.clone()); }
            "System" => { snapshot.system.insert(v.name.clone(), v.value.clone()); }
            _ => {}
        }
    }

    let (content, ext, default_stem, filter_name) = match format.as_str() {
        "reg"     => (crate::export::to_reg(&snapshot, "All"),     "reg",      "envarly-custom",         "Registry files"),
        "ps1"     => (crate::export::to_ps1(&snapshot, "All"),     "ps1",      "envarly-custom",         "PowerShell Script"),
        "dsc_v2"  => (crate::export::to_dsc_v2(&snapshot, "All"),  "ps1",      "envarly-custom-dsc",     "PowerShell DSC Configuration"),
        "dsc_v3"  => (crate::export::to_dsc_v3(&snapshot, "All"),  "dsc.yaml", "envarly-custom-dsc3",    "DSC v3 Configuration"),
        "ansible" => (crate::export::to_ansible(&snapshot, "All"), "yml",      "envarly-custom-ansible", "Ansible Playbook"),
        _         => (crate::export::to_json(&snapshot, "All"),    "json",     "envarly-custom",         "JSON files"),
    };

    let default_name = format!(
        "{}-{}.{}",
        default_stem,
        chrono::Local::now().format("%Y%m%d"),
        ext
    );

    let path = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(filter_name, &[ext])
        .blocking_save_file();

    match path {
        Some(FilePath::Path(p)) => {
            std::fs::write(&p, content.as_bytes()).map_err(EnvarlyError::Registry)?;
            Ok(Some(p.to_string_lossy().into_owned()))
        }
        _ => Ok(None),
    }
}

#[tauri::command]
pub fn validate_paths(paths: Vec<String>) -> Vec<bool> {
    paths
        .iter()
        .map(|p| {
            let cleaned = p.trim_matches(|c: char| c.is_whitespace() || c == '\0');
            std::path::Path::new(&expand_env_vars(cleaned)).exists()
        })
        .collect()
}

pub(crate) fn expand_env_vars(s: &str) -> String {
    let mut result = String::new();
    let mut rest = s;
    while !rest.is_empty() {
        match rest.find('%') {
            None => {
                result.push_str(rest);
                break;
            }
            Some(start) => {
                result.push_str(&rest[..start]);
                rest = &rest[start + 1..];
                match rest.find('%') {
                    None => {
                        // Unmatched % at end of string — keep as-is
                        result.push('%');
                        result.push_str(rest);
                        break;
                    }
                    Some(end) => {
                        let var_name = &rest[..end];
                        rest = &rest[end + 1..];
                        if var_name.is_empty() {
                            // %% → literal %
                            result.push('%');
                        } else if let Ok(val) = std::env::var(var_name) {
                            result.push_str(&val);
                        } else {
                            // Unknown var: keep as-is and continue scanning
                            result.push('%');
                            result.push_str(var_name);
                            result.push('%');
                        }
                    }
                }
            }
        }
    }
    result
}

/// Returns whether the install directory is currently in User / System PATH.
#[tauri::command]
pub fn get_path_status() -> path_manage::PathStatus {
    path_manage::path_status()
}

/// Returns the proposed new PATH value (with envarly added) for the given scope,
/// or None if the install directory is already present.
/// scope: "User" | "System"
#[tauri::command]
pub fn get_path_proposal(scope: String) -> Result<Option<String>, EnvarlyError> {
    let user = scope != "System";
    path_manage::propose_add(user)
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
        let input = "%DOES_NOT_EXIST_ZZZ%";
        let result = expand_env_vars(input);
        assert_eq!(result, input);
    }

    #[test]
    fn expand_continues_after_unknown_var() {
        // Regression: unknown var must not stop expansion of subsequent known vars
        std::env::set_var("_TEST_EXPAND_KNOWN", "found");
        let result = expand_env_vars("%_UNKNOWN_ZZZ_%\\%_TEST_EXPAND_KNOWN%");
        assert_eq!(result, "%_UNKNOWN_ZZZ_%\\found");
        std::env::remove_var("_TEST_EXPAND_KNOWN");
    }

    #[test]
    fn expand_multiple_sequential_known_vars() {
        std::env::set_var("_TEST_EXPAND_A", "alpha");
        std::env::set_var("_TEST_EXPAND_B", "beta");
        let result = expand_env_vars("%_TEST_EXPAND_A%\\%_TEST_EXPAND_B%");
        assert_eq!(result, "alpha\\beta");
        std::env::remove_var("_TEST_EXPAND_A");
        std::env::remove_var("_TEST_EXPAND_B");
    }

    #[test]
    fn expand_double_percent_yields_literal_percent() {
        assert_eq!(expand_env_vars("100%%"), "100%");
        assert_eq!(expand_env_vars("100%%done"), "100%done");
    }

    #[test]
    fn expand_unmatched_percent_at_end() {
        assert_eq!(expand_env_vars("value%"), "value%");
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
