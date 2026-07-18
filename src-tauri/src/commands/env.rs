use crate::env_store::{self, EnvChange, EnvValueKind, EnvVar, VarScope};
use crate::error::EnvarlyError;
use crate::snapshot;

#[tauri::command]
pub fn get_env_vars() -> Result<Vec<EnvVar>, EnvarlyError> {
    env_store::read_all()
}

#[tauri::command]
pub fn get_unsupported_env_values() -> Result<Vec<env_store::UnsupportedEnvValue>, EnvarlyError> {
    env_store::read_unsupported_values()
}

#[tauri::command]
pub fn get_registry_snapshot() -> Result<crate::env_store::EnvSnapshot, EnvarlyError> {
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
pub fn apply_env_changes(changes: Vec<EnvChange>) -> Result<(), EnvarlyError> {
    let snapshot = env_store::read_snapshot()?;
    snapshot::save_snapshot(snapshot, "auto: before apply")?;
    env_store::apply_changes(&changes)
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
