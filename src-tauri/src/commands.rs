use crate::env_store::{self, EnvVar, VarScope};
use crate::error::EnvarlyError;
use crate::snapshot::{self, SnapshotMeta};

#[tauri::command]
pub fn get_env_vars() -> Result<Vec<EnvVar>, EnvarlyError> {
    env_store::read_all()
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

#[tauri::command]
pub fn validate_paths(paths: Vec<String>) -> Vec<bool> {
    paths
        .iter()
        .map(|p| {
            let expanded = expand_env_vars(p);
            std::path::Path::new(&expanded).exists()
        })
        .collect()
}

fn expand_env_vars(s: &str) -> String {
    let mut result = s.to_string();
    // Simple %VAR% expansion using the current process environment
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
