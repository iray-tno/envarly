use serde::Serialize;
use tauri::Emitter;

use crate::env_store;
use crate::error::EnvarlyError;
use crate::model::{EnvChange, EnvSnapshot, EnvValueKind, EnvVar, UnsupportedEnvValue, VarScope};
use crate::snapshot;

/// Emitted on the "apply-progress" channel as each staged change is applied,
/// so the frontend can render a progress bar and a per-variable log.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyProgressEvent {
    pub index: usize,
    pub total: usize,
    pub name: String,
    pub scope: VarScope,
    pub action: &'static str,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub fn get_env_vars() -> Result<Vec<EnvVar>, EnvarlyError> {
    env_store::read_all()
}

#[tauri::command]
pub fn get_unsupported_env_values() -> Result<Vec<UnsupportedEnvValue>, EnvarlyError> {
    env_store::read_unsupported_values()
}

#[tauri::command]
pub fn get_registry_snapshot() -> Result<EnvSnapshot, EnvarlyError> {
    env_store::read_snapshot()
}

#[tauri::command]
pub fn set_env_var(
    name: String,
    value: String,
    value_kind: EnvValueKind,
    scope: VarScope,
) -> Result<(), EnvarlyError> {
    env_store::write_var(&name, &value, value_kind, &scope)
}

#[tauri::command]
pub fn delete_env_var(name: String, scope: VarScope) -> Result<(), EnvarlyError> {
    env_store::delete_var(&name, &scope)
}

#[tauri::command]
pub fn apply_env_changes(
    app: tauri::AppHandle,
    changes: Vec<EnvChange>,
) -> Result<(), EnvarlyError> {
    let snapshot = env_store::read_snapshot()?;
    snapshot::save_snapshot(snapshot, "auto: before apply")?;
    env_store::apply_changes(&changes, |index, total, change, result| {
        let (name, scope, action) = match change {
            EnvChange::Set { name, scope, .. } => (name.clone(), scope.clone(), "set"),
            EnvChange::Delete { name, scope } => (name.clone(), scope.clone(), "delete"),
        };
        let _ = app.emit(
            "apply-progress",
            ApplyProgressEvent {
                index,
                total,
                name,
                scope,
                action,
                success: result.is_ok(),
                error: result.as_ref().err().map(|e| e.to_string()),
            },
        );
    })
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
        let exe = std::env::current_exe().map_err(EnvarlyError::Registry)?;
        let exe_wide: Vec<u16> = exe
            .to_string_lossy()
            .encode_utf16()
            .chain(Some(0))
            .collect();
        let verb: Vec<u16> = "runas\0".encode_utf16().collect();
        // ShellExecuteW with "runas" verb triggers UAC elevation directly
        // without needing an intermediate PowerShell process.
        let result = unsafe {
            windows_sys::Win32::UI::Shell::ShellExecuteW(
                std::ptr::null_mut(),
                verb.as_ptr(),
                exe_wide.as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
                windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL,
            )
        };
        // ShellExecuteW returns > 32 on success
        if result as usize > 32 {
            app.exit(0);
        }
    }
    #[cfg(not(target_os = "windows"))]
    let _ = app;
    Ok(())
}
