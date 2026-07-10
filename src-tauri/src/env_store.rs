#![cfg_attr(not(windows), allow(dead_code))]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::{RegKey, RegValue};

use crate::error::EnvarlyError;

#[cfg(windows)]
const USER_ENV_KEY: &str = "Environment";
#[cfg(windows)]
const SYSTEM_ENV_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum VarScope {
    User,
    System,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum EnvValueKind {
    String,
    ExpandString,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvValue {
    pub value: String,
    /// Legacy snapshots have no registry type. They remain readable, but the
    /// frontend must resolve the type before staging a restore.
    pub kind: Option<EnvValueKind>,
}

impl EnvValue {
    pub fn typed(value: String, kind: EnvValueKind) -> Self {
        Self {
            value,
            kind: Some(kind),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvVar {
    pub name: String,
    pub value: String,
    pub scope: VarScope,
    pub value_kind: EnvValueKind,
    /// ";", ",", or null — indicates how the value should be rendered as a list.
    pub list_separator: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvSnapshot {
    pub user: HashMap<String, EnvValue>,
    pub system: HashMap<String, EnvValue>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UnsupportedEnvValue {
    pub name: String,
    pub scope: VarScope,
    pub registry_type: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(tag = "changeType", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum EnvChange {
    Set {
        name: String,
        value: String,
        value_kind: EnvValueKind,
        scope: VarScope,
    },
    Delete {
        name: String,
        scope: VarScope,
    },
}

// ---------------------------------------------------------------------------
// Storage abstraction
// ---------------------------------------------------------------------------

pub trait EnvBackend: Send + Sync {
    fn read_user(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError>;
    fn read_system(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError>;
    fn write_user(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError>;
    fn write_system(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError>;
    fn delete_user(&self, name: &str) -> Result<(), EnvarlyError>;
    fn delete_system(&self, name: &str) -> Result<(), EnvarlyError>;
    fn is_elevated(&self) -> bool;
    fn broadcast_changes(&self) {}
}

// ---------------------------------------------------------------------------
// Production backend: Windows registry
// ---------------------------------------------------------------------------

#[cfg(windows)]
pub struct WinregBackend;

#[cfg(windows)]
impl EnvBackend for WinregBackend {
    fn read_user(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
        let key = RegKey::predef(HKEY_CURRENT_USER).open_subkey(USER_ENV_KEY)?;
        Ok(iter_string_values(&key).collect())
    }

    fn read_system(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
        let key = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(SYSTEM_ENV_KEY)?;
        Ok(iter_string_values(&key).collect())
    }

    fn write_user(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(USER_ENV_KEY, KEY_SET_VALUE)?;
        key.set_raw_value(name, &to_reg_value(value)?)?;
        Ok(())
    }

    fn write_system(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
        let key = RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)?;
        key.set_raw_value(name, &to_reg_value(value)?)?;
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
    pub user: std::sync::Mutex<HashMap<String, EnvValue>>,
    pub system: std::sync::Mutex<HashMap<String, EnvValue>>,
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

    pub fn with_user(self, vars: impl IntoIterator<Item = (&'static str, &'static str)>) -> Self {
        *self.user.lock().unwrap() = vars
            .into_iter()
            .map(|(k, v)| {
                (
                    k.to_string(),
                    EnvValue::typed(v.to_string(), EnvValueKind::String),
                )
            })
            .collect();
        self
    }

    pub fn with_elevated(mut self, elevated: bool) -> Self {
        self.elevated = elevated;
        self
    }
}

#[cfg(test)]
impl EnvBackend for MemBackend {
    fn read_user(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
        Ok(self.user.lock().unwrap().clone())
    }

    fn read_system(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
        Ok(self.system.lock().unwrap().clone())
    }

    fn write_user(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
        self.user
            .lock()
            .unwrap()
            .insert(name.to_string(), value.clone());
        Ok(())
    }

    fn write_system(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
        if !self.elevated {
            return Err(EnvarlyError::Registry(std::io::Error::from(
                std::io::ErrorKind::PermissionDenied,
            )));
        }
        self.system
            .lock()
            .unwrap()
            .insert(name.to_string(), value.clone());
        Ok(())
    }

    fn delete_user(&self, name: &str) -> Result<(), EnvarlyError> {
        self.user.lock().unwrap().remove(name).ok_or_else(|| {
            EnvarlyError::Registry(std::io::Error::from(std::io::ErrorKind::NotFound))
        })?;
        Ok(())
    }

    fn delete_system(&self, name: &str) -> Result<(), EnvarlyError> {
        if !self.elevated {
            return Err(EnvarlyError::Registry(std::io::Error::from(
                std::io::ErrorKind::PermissionDenied,
            )));
        }
        self.system.lock().unwrap().remove(name).ok_or_else(|| {
            EnvarlyError::Registry(std::io::Error::from(std::io::ErrorKind::NotFound))
        })?;
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

    for (name, env_value) in backend.read_user()? {
        let value_kind = env_value.kind.ok_or_else(|| {
            EnvarlyError::InvalidInput(format!("registry value {name:?} has no type"))
        })?;
        let list_separator = detect_list_separator(&name, &env_value.value);
        vars.push(EnvVar {
            name,
            value: env_value.value,
            scope: VarScope::User,
            value_kind,
            list_separator,
        });
    }
    for (name, env_value) in backend.read_system()? {
        let value_kind = env_value.kind.ok_or_else(|| {
            EnvarlyError::InvalidInput(format!("registry value {name:?} has no type"))
        })?;
        let list_separator = detect_list_separator(&name, &env_value.value);
        vars.push(EnvVar {
            name,
            value: env_value.value,
            scope: VarScope::System,
            value_kind,
            list_separator,
        });
    }

    vars.sort_by_key(|a| a.name.to_lowercase());
    Ok(vars)
}

pub fn read_snapshot_with(backend: &dyn EnvBackend) -> Result<EnvSnapshot, EnvarlyError> {
    Ok(EnvSnapshot {
        user: backend.read_user()?,
        system: backend.read_system()?,
    })
}

pub fn write_var_with(
    backend: &dyn EnvBackend,
    name: &str,
    value: &str,
    kind: EnvValueKind,
    scope: &VarScope,
) -> Result<(), EnvarlyError> {
    let env_value = EnvValue::typed(value.to_string(), kind);
    match scope {
        VarScope::User => backend.write_user(name, &env_value)?,
        VarScope::System => backend.write_system(name, &env_value)?,
    }
    let written = match scope {
        VarScope::User => backend.read_user()?,
        VarScope::System => backend.read_system()?,
    };
    if written.get(name) != Some(&env_value) {
        return Err(EnvarlyError::InvalidInput(format!(
            "registry verification failed for {name:?}"
        )));
    }
    backend.broadcast_changes();
    Ok(())
}

pub fn delete_var_with(
    backend: &dyn EnvBackend,
    name: &str,
    scope: &VarScope,
) -> Result<(), EnvarlyError> {
    match scope {
        VarScope::User => backend.delete_user(name)?,
        VarScope::System => backend.delete_system(name)?,
    }
    backend.broadcast_changes();
    Ok(())
}

pub fn apply_changes_with(
    backend: &dyn EnvBackend,
    changes: &[EnvChange],
) -> Result<(), EnvarlyError> {
    let baseline = read_snapshot_with(backend)?;

    for change in changes {
        let result = match change {
            EnvChange::Set {
                name,
                value,
                value_kind,
                scope,
            } => {
                let env_value = EnvValue::typed(value.clone(), *value_kind);
                match scope {
                    VarScope::User => backend.write_user(name, &env_value),
                    VarScope::System => backend.write_system(name, &env_value),
                }
                .and_then(|()| verify_value(backend, name, scope, Some(&env_value)))
            }
            EnvChange::Delete { name, scope } => match scope {
                VarScope::User => backend.delete_user(name),
                VarScope::System => backend.delete_system(name),
            }
            .and_then(|()| verify_value(backend, name, scope, None)),
        };

        if let Err(error) = result {
            let rollback = restore_snapshot_with(backend, &baseline);
            backend.broadcast_changes();
            return match rollback {
                Ok(()) => Err(error),
                Err(rollback_error) => Err(EnvarlyError::InvalidInput(format!(
                    "apply failed: {error}; rollback also failed: {rollback_error}"
                ))),
            };
        }
    }

    backend.broadcast_changes();
    Ok(())
}

fn verify_value(
    backend: &dyn EnvBackend,
    name: &str,
    scope: &VarScope,
    expected: Option<&EnvValue>,
) -> Result<(), EnvarlyError> {
    let values = match scope {
        VarScope::User => backend.read_user()?,
        VarScope::System => backend.read_system()?,
    };
    if values.get(name) == expected {
        Ok(())
    } else {
        Err(EnvarlyError::InvalidInput(format!(
            "registry verification failed for {name:?}"
        )))
    }
}

fn restore_snapshot_with(
    backend: &dyn EnvBackend,
    snapshot: &EnvSnapshot,
) -> Result<(), EnvarlyError> {
    restore_scope(
        backend.read_user()?,
        &snapshot.user,
        |name, value| backend.write_user(name, value),
        |name| backend.delete_user(name),
    )?;
    restore_scope(
        backend.read_system()?,
        &snapshot.system,
        |name, value| backend.write_system(name, value),
        |name| backend.delete_system(name),
    )
}

fn restore_scope(
    current: HashMap<String, EnvValue>,
    baseline: &HashMap<String, EnvValue>,
    write: impl Fn(&str, &EnvValue) -> Result<(), EnvarlyError>,
    delete: impl Fn(&str) -> Result<(), EnvarlyError>,
) -> Result<(), EnvarlyError> {
    for name in current.keys().filter(|name| !baseline.contains_key(*name)) {
        delete(name)?;
    }
    for (name, value) in baseline {
        write(name, value)?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Public API — thin wrappers using WinregBackend (Windows only)
// ---------------------------------------------------------------------------

#[cfg(windows)]
pub fn read_all() -> Result<Vec<EnvVar>, EnvarlyError> {
    read_all_with(&WinregBackend)
}

#[cfg(windows)]
pub fn read_snapshot() -> Result<EnvSnapshot, EnvarlyError> {
    read_snapshot_with(&WinregBackend)
}

#[cfg(windows)]
pub fn write_var(
    name: &str,
    value: &str,
    kind: EnvValueKind,
    scope: &VarScope,
) -> Result<(), EnvarlyError> {
    write_var_with(&WinregBackend, name, value, kind, scope)
}

#[cfg(windows)]
pub fn delete_var(name: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    delete_var_with(&WinregBackend, name, scope)
}

#[cfg(windows)]
pub fn apply_changes(changes: &[EnvChange]) -> Result<(), EnvarlyError> {
    apply_changes_with(&WinregBackend, changes)
}

#[cfg(windows)]
pub fn is_elevated() -> bool {
    WinregBackend.is_elevated()
}

#[cfg(windows)]
pub fn read_unsupported_values() -> Result<Vec<UnsupportedEnvValue>, EnvarlyError> {
    let user = RegKey::predef(HKEY_CURRENT_USER).open_subkey(USER_ENV_KEY)?;
    let system = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(SYSTEM_ENV_KEY)?;
    let mut values = unsupported_values(&user, VarScope::User)
        .chain(unsupported_values(&system, VarScope::System))
        .collect::<Vec<_>>();
    values.sort_by(|a, b| {
        let scope_order = |scope: &VarScope| match scope {
            VarScope::User => 0,
            VarScope::System => 1,
        };
        scope_order(&a.scope)
            .cmp(&scope_order(&b.scope))
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(values)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

pub(crate) fn detect_list_separator(name: &str, value: &str) -> Option<String> {
    let upper = name.to_uppercase();
    // Well-known semicolon-separated variables (no backslash in values)
    if matches!(upper.as_str(), "PATH" | "PATHEXT") {
        return Some(";".to_string());
    }
    // Comma-separated list variables
    if matches!(upper.as_str(), "NO_PROXY" | "NOPROXY") {
        return Some(",".to_string());
    }
    // Semicolon-separated path lists: value has ";" and at least one part contains "\"
    if value.contains(';') && value.split(';').any(|part| part.contains('\\')) {
        return Some(";".to_string());
    }
    None
}

#[cfg(windows)]
fn iter_string_values(key: &RegKey) -> impl Iterator<Item = (String, EnvValue)> + '_ {
    key.enum_values().filter_map(|v| {
        let (name, val) = v.ok()?;
        let kind = match val.vtype {
            REG_SZ => Some(EnvValueKind::String),
            REG_EXPAND_SZ => Some(EnvValueKind::ExpandString),
            _ => None,
        }?;
        Some((name, EnvValue::typed(val.to_string(), kind)))
    })
}

#[cfg(windows)]
fn unsupported_values(
    key: &RegKey,
    scope: VarScope,
) -> impl Iterator<Item = UnsupportedEnvValue> + '_ {
    key.enum_values().filter_map(move |value| {
        let (name, value) = value.ok()?;
        if matches!(value.vtype, REG_SZ | REG_EXPAND_SZ) {
            return None;
        }
        Some(UnsupportedEnvValue {
            name,
            scope: scope.clone(),
            registry_type: format!("{:?}", value.vtype),
        })
    })
}

#[cfg(windows)]
fn to_reg_value(value: &EnvValue) -> Result<RegValue, EnvarlyError> {
    let kind = value.kind.ok_or_else(|| {
        EnvarlyError::InvalidInput("registry type must be resolved before writing".into())
    })?;
    let mut bytes = Vec::with_capacity((value.value.encode_utf16().count() + 1) * 2);
    for unit in value.value.encode_utf16().chain(std::iter::once(0)) {
        bytes.extend_from_slice(&unit.to_le_bytes());
    }
    Ok(RegValue {
        bytes,
        vtype: match kind {
            EnvValueKind::String => REG_SZ,
            EnvValueKind::ExpandString => REG_EXPAND_SZ,
        },
    })
}
#[cfg(windows)]
pub(crate) fn broadcast_settings_change() {
    #[cfg(target_os = "windows")]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            SendMessageTimeoutW, HWND_BROADCAST, SMTO_ABORTIFHUNG, WM_SETTINGCHANGE,
        };
        let env = "Environment\0".encode_utf16().collect::<Vec<u16>>();
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

    // --- detect_list_separator ---

    #[test]
    fn path_name_always_semicolon() {
        assert_eq!(
            detect_list_separator("PATH", "anything"),
            Some(";".to_string())
        );
        assert_eq!(
            detect_list_separator("path", "anything"),
            Some(";".to_string())
        );
        assert_eq!(
            detect_list_separator("Path", "anything"),
            Some(";".to_string())
        );
    }

    #[test]
    fn semicolon_with_backslash_is_semicolon() {
        assert_eq!(
            detect_list_separator("PSModulePath", r"C:\Windows\System32;C:\Windows"),
            Some(";".to_string())
        );
    }

    #[test]
    fn pathext_is_semicolon() {
        assert_eq!(
            detect_list_separator("PATHEXT", ".COM;.EXE;.BAT;.CMD"),
            Some(";".to_string())
        );
        assert_eq!(
            detect_list_separator("pathext", ".COM;.EXE"),
            Some(";".to_string())
        );
    }

    #[test]
    fn single_value_not_detected() {
        assert_eq!(
            detect_list_separator("JAVA_HOME", r"C:\Program Files\Java\jdk-21"),
            None
        );
    }

    #[test]
    fn no_proxy_is_comma() {
        assert_eq!(
            detect_list_separator("NO_PROXY", "localhost,127.0.0.1"),
            Some(",".to_string())
        );
        assert_eq!(
            detect_list_separator("no_proxy", "localhost"),
            Some(",".to_string())
        );
        assert_eq!(
            detect_list_separator("NOPROXY", "localhost"),
            Some(",".to_string())
        );
    }

    // --- MemBackend read/write/delete ---

    #[test]
    fn write_and_read_user_var() {
        let b = backend();
        write_var_with(&b, "MY_VAR", "hello", EnvValueKind::String, &VarScope::User).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(
            snap.user.get("MY_VAR").map(|value| value.value.as_str()),
            Some("hello")
        );
        assert!(snap.system.is_empty());
    }

    #[test]
    fn write_and_read_system_var_elevated() {
        let b = backend(); // elevated = true by default
        write_var_with(
            &b,
            "SYS_VAR",
            "world",
            EnvValueKind::ExpandString,
            &VarScope::System,
        )
        .unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(
            snap.system.get("SYS_VAR").map(|value| value.value.as_str()),
            Some("world")
        );
        assert_eq!(
            snap.system["SYS_VAR"].kind,
            Some(EnvValueKind::ExpandString)
        );
    }

    #[test]
    fn write_system_var_non_elevated_returns_error() {
        let b = MemBackend::new().with_elevated(false);
        let err = write_var_with(&b, "SYS_VAR", "x", EnvValueKind::String, &VarScope::System)
            .unwrap_err();
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
        let b = MemBackend::new().with_user([("ZEBRA", "z"), ("APPLE", "a")]);
        *b.system.lock().unwrap() = [(
            "MIDDLE".to_string(),
            EnvValue::typed("m".to_string(), EnvValueKind::String),
        )]
        .into();

        let vars = read_all_with(&b).unwrap();
        let names: Vec<&str> = vars.iter().map(|v| v.name.as_str()).collect();
        assert_eq!(names, ["APPLE", "MIDDLE", "ZEBRA"]);
    }

    #[test]
    fn read_all_sets_list_separator_correctly() {
        let b = MemBackend::new().with_user([
            ("PATH", r"C:\Windows;C:\Windows\System32"),
            ("PATHEXT", ".COM;.EXE;.BAT"),
            ("JAVA_HOME", r"C:\jdk21"),
            ("NO_PROXY", "localhost,127.0.0.1"),
        ]);
        let vars = read_all_with(&b).unwrap();
        let map: HashMap<&str, Option<String>> = vars
            .iter()
            .map(|v| (v.name.as_str(), v.list_separator.clone()))
            .collect();
        assert_eq!(map["PATH"], Some(";".to_string()));
        assert_eq!(map["PATHEXT"], Some(";".to_string()));
        assert_eq!(map["JAVA_HOME"], None);
        assert_eq!(map["NO_PROXY"], Some(",".to_string()));
    }

    #[test]
    fn overwrite_existing_var() {
        let b = backend().with_user([("MY_VAR", "old")]);
        write_var_with(&b, "MY_VAR", "new", EnvValueKind::String, &VarScope::User).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(snap.user["MY_VAR"].value, "new");
    }

    #[test]
    fn atomic_apply_preserves_types() {
        let b = backend().with_user([("EXPANDED", "%USERPROFILE%\\bin")]);
        apply_changes_with(
            &b,
            &[EnvChange::Set {
                name: "EXPANDED".into(),
                value: "%USERPROFILE%\\tools".into(),
                value_kind: EnvValueKind::ExpandString,
                scope: VarScope::User,
            }],
        )
        .unwrap();

        let value = &read_snapshot_with(&b).unwrap().user["EXPANDED"];
        assert_eq!(value.value, "%USERPROFILE%\\tools");
        assert_eq!(value.kind, Some(EnvValueKind::ExpandString));
    }

    #[test]
    fn env_change_deserializes_camel_case_fields() {
        let change: EnvChange = serde_json::from_value(serde_json::json!({
            "changeType": "set",
            "name": "EXPANDED",
            "value": "%USERPROFILE%\\tools",
            "valueKind": "ExpandString",
            "scope": "User"
        }))
        .unwrap();

        assert_eq!(
            change,
            EnvChange::Set {
                name: "EXPANDED".into(),
                value: "%USERPROFILE%\\tools".into(),
                value_kind: EnvValueKind::ExpandString,
                scope: VarScope::User,
            }
        );
    }

    #[test]
    fn atomic_apply_rolls_back_prior_changes_after_failure() {
        let b = MemBackend::new()
            .with_user([("KEEP", "original")])
            .with_elevated(false);
        let result = apply_changes_with(
            &b,
            &[
                EnvChange::Set {
                    name: "KEEP".into(),
                    value: "changed".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "DENIED".into(),
                    value: "value".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::System,
                },
            ],
        );

        assert!(result.is_err());
        assert_eq!(
            read_snapshot_with(&b).unwrap().user["KEEP"].value,
            "original"
        );
    }
}
