use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use winreg::enums::*;
use winreg::RegKey;

use crate::error::EnvarlyError;

const USER_ENV_KEY: &str = "Environment";
const SYSTEM_ENV_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum VarScope {
    User,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvVar {
    pub name: String,
    pub value: String,
    pub scope: VarScope,
    pub is_path_like: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvSnapshot {
    pub user: HashMap<String, String>,
    pub system: HashMap<String, String>,
}

// ---------------------------------------------------------------------------
// Storage abstraction
// ---------------------------------------------------------------------------

pub trait EnvBackend: Send + Sync {
    fn read_user(&self) -> Result<HashMap<String, String>, EnvarlyError>;
    fn read_system(&self) -> Result<HashMap<String, String>, EnvarlyError>;
    fn write_user(&self, name: &str, value: &str) -> Result<(), EnvarlyError>;
    fn write_system(&self, name: &str, value: &str) -> Result<(), EnvarlyError>;
    fn delete_user(&self, name: &str) -> Result<(), EnvarlyError>;
    fn delete_system(&self, name: &str) -> Result<(), EnvarlyError>;
    fn is_elevated(&self) -> bool;
    fn broadcast_changes(&self) {}
}

// ---------------------------------------------------------------------------
// Production backend: Windows registry
// ---------------------------------------------------------------------------

pub struct WinregBackend;

impl EnvBackend for WinregBackend {
    fn read_user(&self) -> Result<HashMap<String, String>, EnvarlyError> {
        let key = RegKey::predef(HKEY_CURRENT_USER).open_subkey(USER_ENV_KEY)?;
        Ok(iter_string_values(&key).collect())
    }

    fn read_system(&self) -> Result<HashMap<String, String>, EnvarlyError> {
        let key = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(SYSTEM_ENV_KEY)?;
        Ok(iter_string_values(&key).collect())
    }

    fn write_user(&self, name: &str, value: &str) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(USER_ENV_KEY, KEY_SET_VALUE)?;
        key.set_value(name, &value)?;
        Ok(())
    }

    fn write_system(&self, name: &str, value: &str) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)?;
        key.set_value(name, &value)?;
        Ok(())
    }

    fn delete_user(&self, name: &str) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(USER_ENV_KEY, KEY_SET_VALUE)?;
        key.delete_value(name)?;
        Ok(())
    }

    fn delete_system(&self, name: &str) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)?;
        key.delete_value(name)?;
        Ok(())
    }

    fn is_elevated(&self) -> bool {
        RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)
            .is_ok()
    }

    fn broadcast_changes(&self) {
        broadcast_settings_change();
    }
}

// ---------------------------------------------------------------------------
// In-memory backend for tests
// ---------------------------------------------------------------------------

#[cfg(test)]
pub struct MemBackend {
    pub user: std::sync::Mutex<HashMap<String, String>>,
    pub system: std::sync::Mutex<HashMap<String, String>>,
    pub elevated: bool,
}

#[cfg(test)]
impl MemBackend {
    pub fn new() -> Self {
        Self {
            user: std::sync::Mutex::new(HashMap::new()),
            system: std::sync::Mutex::new(HashMap::new()),
            elevated: true,
        }
    }

    pub fn with_user(mut self, vars: impl IntoIterator<Item = (&'static str, &'static str)>) -> Self {
        *self.user.lock().unwrap() = vars.into_iter().map(|(k, v)| (k.to_string(), v.to_string())).collect();
        self
    }

    pub fn with_elevated(mut self, elevated: bool) -> Self {
        self.elevated = elevated;
        self
    }
}

#[cfg(test)]
impl EnvBackend for MemBackend {
    fn read_user(&self) -> Result<HashMap<String, String>, EnvarlyError> {
        Ok(self.user.lock().unwrap().clone())
    }

    fn read_system(&self) -> Result<HashMap<String, String>, EnvarlyError> {
        Ok(self.system.lock().unwrap().clone())
    }

    fn write_user(&self, name: &str, value: &str) -> Result<(), EnvarlyError> {
        self.user.lock().unwrap().insert(name.to_string(), value.to_string());
        Ok(())
    }

    fn write_system(&self, name: &str, value: &str) -> Result<(), EnvarlyError> {
        if !self.elevated {
            return Err(EnvarlyError::Registry(std::io::Error::from(
                std::io::ErrorKind::PermissionDenied,
            )));
        }
        self.system.lock().unwrap().insert(name.to_string(), value.to_string());
        Ok(())
    }

    fn delete_user(&self, name: &str) -> Result<(), EnvarlyError> {
        self.user.lock().unwrap().remove(name)
            .ok_or_else(|| EnvarlyError::Registry(std::io::Error::from(std::io::ErrorKind::NotFound)))?;
        Ok(())
    }

    fn delete_system(&self, name: &str) -> Result<(), EnvarlyError> {
        if !self.elevated {
            return Err(EnvarlyError::Registry(std::io::Error::from(
                std::io::ErrorKind::PermissionDenied,
            )));
        }
        self.system.lock().unwrap().remove(name)
            .ok_or_else(|| EnvarlyError::Registry(std::io::Error::from(std::io::ErrorKind::NotFound)))?;
        Ok(())
    }

    fn is_elevated(&self) -> bool {
        self.elevated
    }
    // broadcast_changes: uses default no-op
}

// ---------------------------------------------------------------------------
// Business logic (backend-agnostic)
// ---------------------------------------------------------------------------

pub fn read_all_with(backend: &dyn EnvBackend) -> Result<Vec<EnvVar>, EnvarlyError> {
    let mut vars: Vec<EnvVar> = Vec::new();

    for (name, value) in backend.read_user()? {
        let is_path_like = is_path_list(&name, &value);
        vars.push(EnvVar { name, value, scope: VarScope::User, is_path_like });
    }
    for (name, value) in backend.read_system()? {
        let is_path_like = is_path_list(&name, &value);
        vars.push(EnvVar { name, value, scope: VarScope::System, is_path_like });
    }

    vars.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(vars)
}

pub fn read_snapshot_with(backend: &dyn EnvBackend) -> Result<EnvSnapshot, EnvarlyError> {
    Ok(EnvSnapshot {
        user: backend.read_user()?,
        system: backend.read_system()?,
    })
}

pub fn write_var_with(backend: &dyn EnvBackend, name: &str, value: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    match scope {
        VarScope::User   => backend.write_user(name, value)?,
        VarScope::System => backend.write_system(name, value)?,
    }
    backend.broadcast_changes();
    Ok(())
}

pub fn delete_var_with(backend: &dyn EnvBackend, name: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    match scope {
        VarScope::User   => backend.delete_user(name)?,
        VarScope::System => backend.delete_system(name)?,
    }
    backend.broadcast_changes();
    Ok(())
}

// ---------------------------------------------------------------------------
// Public API — thin wrappers using WinregBackend
// ---------------------------------------------------------------------------

pub fn read_all() -> Result<Vec<EnvVar>, EnvarlyError> {
    read_all_with(&WinregBackend)
}

pub fn read_snapshot() -> Result<EnvSnapshot, EnvarlyError> {
    read_snapshot_with(&WinregBackend)
}

pub fn write_var(name: &str, value: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    write_var_with(&WinregBackend, name, value, scope)
}

pub fn delete_var(name: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    delete_var_with(&WinregBackend, name, scope)
}

pub fn is_elevated() -> bool {
    WinregBackend.is_elevated()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

pub(crate) fn is_path_list(name: &str, value: &str) -> bool {
    if name.to_uppercase() == "PATH" {
        return true;
    }
    value.contains(';') && value.split(';').any(|part| part.contains('\\'))
}

fn iter_string_values(key: &RegKey) -> impl Iterator<Item = (String, String)> + '_ {
    key.enum_values().filter_map(|v| {
        let (name, val) = v.ok()?;
        match val.vtype {
            REG_SZ | REG_EXPAND_SZ => Some((name, val.to_string())),
            _ => None,
        }
    })
}

fn broadcast_settings_change() {
    #[cfg(target_os = "windows")]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            SendMessageTimeoutW, HWND_BROADCAST, SMTO_ABORTIFHUNG, WM_SETTINGCHANGE,
        };
        let env = "Environment\0"
            .encode_utf16()
            .collect::<Vec<u16>>();
        SendMessageTimeoutW(
            HWND_BROADCAST,
            WM_SETTINGCHANGE,
            0,
            env.as_ptr() as isize,
            SMTO_ABORTIFHUNG,
            5000,
            std::ptr::null_mut(),
        );
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn backend() -> MemBackend {
        MemBackend::new()
    }

    // --- is_path_list ---

    #[test]
    fn path_name_is_always_path_like() {
        assert!(is_path_list("PATH", "anything"));
        assert!(is_path_list("path", "anything"));
        assert!(is_path_list("Path", "anything"));
    }

    #[test]
    fn semicolon_with_backslash_is_path_like() {
        assert!(is_path_list("PSModulePath", r"C:\Windows\System32;C:\Windows"));
    }

    #[test]
    fn pathext_is_not_path_like() {
        assert!(!is_path_list("PATHEXT", ".COM;.EXE;.BAT;.CMD"));
    }

    #[test]
    fn single_value_no_semicolon_not_path_like() {
        assert!(!is_path_list("JAVA_HOME", r"C:\Program Files\Java\jdk-21"));
    }

    // --- MemBackend read/write/delete ---

    #[test]
    fn write_and_read_user_var() {
        let b = backend();
        write_var_with(&b, "MY_VAR", "hello", &VarScope::User).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(snap.user.get("MY_VAR").map(String::as_str), Some("hello"));
        assert!(snap.system.is_empty());
    }

    #[test]
    fn write_and_read_system_var_elevated() {
        let b = backend(); // elevated = true by default
        write_var_with(&b, "SYS_VAR", "world", &VarScope::System).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(snap.system.get("SYS_VAR").map(String::as_str), Some("world"));
    }

    #[test]
    fn write_system_var_non_elevated_returns_error() {
        let b = MemBackend::new().with_elevated(false);
        let err = write_var_with(&b, "SYS_VAR", "x", &VarScope::System).unwrap_err();
        assert!(matches!(err, EnvarlyError::Registry(_)));
    }

    #[test]
    fn delete_existing_user_var() {
        let b = backend().with_user([("TO_DELETE", "v")]);
        delete_var_with(&b, "TO_DELETE", &VarScope::User).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert!(!snap.user.contains_key("TO_DELETE"));
    }

    #[test]
    fn delete_nonexistent_var_returns_error() {
        let b = backend();
        assert!(delete_var_with(&b, "NO_SUCH_VAR", &VarScope::User).is_err());
    }

    #[test]
    fn read_all_with_combines_and_sorts() {
        let b = MemBackend::new()
            .with_user([("ZEBRA", "z"), ("APPLE", "a")]);
        *b.system.lock().unwrap() = [("MIDDLE".to_string(), "m".to_string())].into();

        let vars = read_all_with(&b).unwrap();
        let names: Vec<&str> = vars.iter().map(|v| v.name.as_str()).collect();
        assert_eq!(names, ["APPLE", "MIDDLE", "ZEBRA"]);
    }

    #[test]
    fn read_all_sets_is_path_like_correctly() {
        let b = MemBackend::new().with_user([
            ("PATH", r"C:\Windows;C:\Windows\System32"),
            ("PATHEXT", ".COM;.EXE;.BAT"),
            ("JAVA_HOME", r"C:\jdk21"),
        ]);
        let vars = read_all_with(&b).unwrap();
        let map: HashMap<&str, bool> = vars.iter().map(|v| (v.name.as_str(), v.is_path_like)).collect();
        assert_eq!(map["PATH"], true);
        assert_eq!(map["PATHEXT"], false);
        assert_eq!(map["JAVA_HOME"], false);
    }

    #[test]
    fn overwrite_existing_var() {
        let b = backend().with_user([("MY_VAR", "old")]);
        write_var_with(&b, "MY_VAR", "new", &VarScope::User).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(snap.user["MY_VAR"], "new");
    }
}
