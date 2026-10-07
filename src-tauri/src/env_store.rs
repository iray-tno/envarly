#![cfg_attr(not(windows), allow(dead_code))]

use std::collections::HashMap;

use crate::error::EnvarlyError;
use crate::model::{EnvChange, EnvSnapshot, EnvValue, EnvValueKind, EnvVar, VarScope};

#[cfg(windows)]
pub(crate) use crate::env_backend::broadcast_settings_change;
#[cfg(windows)]
pub use crate::env_backend::{read_unsupported_values, WinregBackend};

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

    /// The currently-selected other-user account's variables, if any. Returns
    /// `Ok(None)` (not an error) when no other-user account is selected, so
    /// existing callers (snapshot/apply/rollback) can call this unconditionally
    /// without changing behavior for the common case.
    fn read_other_user(&self) -> Result<Option<HashMap<String, EnvValue>>, EnvarlyError> {
        Ok(None)
    }
    /// Only ever called for `VarScope::OtherUser`, which the frontend can only
    /// send when it has an account selected — hitting the default (no active
    /// hive) here is a genuine error, unlike `read_other_user`.
    fn write_other_user(&self, _name: &str, _value: &EnvValue) -> Result<(), EnvarlyError> {
        Err(EnvarlyError::InvalidInput(
            "no other-user account selected".into(),
        ))
    }
    fn delete_other_user(&self, _name: &str) -> Result<(), EnvarlyError> {
        Err(EnvarlyError::InvalidInput(
            "no other-user account selected".into(),
        ))
    }
}

// ---------------------------------------------------------------------------
// In-memory backend for tests
// ---------------------------------------------------------------------------

#[cfg(test)]
pub struct MemBackend {
    pub user: std::sync::Mutex<HashMap<String, EnvValue>>,
    pub system: std::sync::Mutex<HashMap<String, EnvValue>>,
    /// `None` means "no other-user account selected" (the common case).
    pub other_user: std::sync::Mutex<Option<HashMap<String, EnvValue>>>,
    pub elevated: bool,
}

#[cfg(test)]
impl MemBackend {
    pub fn new() -> Self {
        Self {
            user: std::sync::Mutex::new(HashMap::new()),
            system: std::sync::Mutex::new(HashMap::new()),
            other_user: std::sync::Mutex::new(None),
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

    /// Selects an other-user account with the given starting variables (mirrors
    /// `user_hive::select_account` making a hive active for real).
    pub fn with_other_user(
        self,
        vars: impl IntoIterator<Item = (&'static str, &'static str)>,
    ) -> Self {
        *self.other_user.lock().unwrap() = Some(
            vars.into_iter()
                .map(|(k, v)| {
                    (
                        k.to_string(),
                        EnvValue::typed(v.to_string(), EnvValueKind::String),
                    )
                })
                .collect(),
        );
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

    fn read_other_user(&self) -> Result<Option<HashMap<String, EnvValue>>, EnvarlyError> {
        Ok(self.other_user.lock().unwrap().clone())
    }

    fn write_other_user(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
        let mut guard = self.other_user.lock().unwrap();
        let Some(map) = guard.as_mut() else {
            return Err(EnvarlyError::InvalidInput(
                "no other-user account selected".into(),
            ));
        };
        map.insert(name.to_string(), value.clone());
        Ok(())
    }

    fn delete_other_user(&self, name: &str) -> Result<(), EnvarlyError> {
        let mut guard = self.other_user.lock().unwrap();
        let Some(map) = guard.as_mut() else {
            return Err(EnvarlyError::InvalidInput(
                "no other-user account selected".into(),
            ));
        };
        map.remove(name).ok_or_else(|| {
            EnvarlyError::Registry(std::io::Error::from(std::io::ErrorKind::NotFound))
        })?;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Business logic (backend-agnostic)
// ---------------------------------------------------------------------------

pub fn read_all_with(backend: &dyn EnvBackend) -> Result<Vec<EnvVar>, EnvarlyError> {
    let mut vars: Vec<EnvVar> = Vec::new();

    // "Switch mode": when another account is active, its variables take the
    // place of the real current user's — the two are never shown together.
    let other_user = backend.read_other_user()?;
    let (personal_vars, personal_scope) = match &other_user {
        Some(vars) => (vars.clone(), VarScope::OtherUser),
        None => (backend.read_user()?, VarScope::User),
    };

    for (name, env_value) in personal_vars {
        let value_kind = env_value.kind.ok_or_else(|| {
            EnvarlyError::InvalidInput(format!("registry value {name:?} has no type"))
        })?;
        let list_separator = detect_list_separator(&name, &env_value.value);
        vars.push(EnvVar {
            name,
            value: env_value.value,
            scope: personal_scope.clone(),
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
        other_user: backend.read_other_user()?,
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
        VarScope::OtherUser => backend.write_other_user(name, &env_value)?,
    }
    let written = match scope {
        VarScope::User => backend.read_user()?,
        VarScope::System => backend.read_system()?,
        VarScope::OtherUser => backend.read_other_user()?.unwrap_or_default(),
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
        VarScope::OtherUser => backend.delete_other_user(name)?,
    }
    backend.broadcast_changes();
    Ok(())
}

pub fn apply_changes_with(
    backend: &dyn EnvBackend,
    changes: &[EnvChange],
    mut on_progress: impl FnMut(usize, usize, &EnvChange, &Result<(), EnvarlyError>),
) -> Result<(), EnvarlyError> {
    let mut journal = Vec::new();
    let total = changes.len();

    for (index, change) in changes.iter().enumerate() {
        let (name, scope, expected) = match change {
            EnvChange::Set {
                name,
                scope,
                value,
                value_kind,
            } => (
                name,
                scope,
                Some(EnvValue::typed(value.clone(), *value_kind)),
            ),
            EnvChange::Delete { name, scope } => (name, scope, None),
        };
        let before = read_scope_value(backend, name, scope);
        let original = before.as_ref().ok().cloned();
        let mut wrote = false;
        let result = before.and_then(|before| {
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
                        VarScope::OtherUser => backend.write_other_user(name, &env_value),
                    }
                }
                EnvChange::Delete { name, scope } => match scope {
                    VarScope::User => backend.delete_user(name),
                    VarScope::System => backend.delete_system(name),
                    VarScope::OtherUser => backend.delete_other_user(name),
                },
            };
            if result.is_ok() {
                wrote = true;
                journal.push(RollbackEntry {
                    name: name.clone(),
                    scope: scope.clone(),
                    before,
                    expected: expected.clone(),
                });
            }
            result.and_then(|()| verify_value(backend, name, scope, expected.as_ref()))
        });

        on_progress(index, total, change, &result);

        if let Err(error) = result {
            // A backend error may leave the mutation outcome unknown. Never
            // overwrite an unexpected value in an attempt to guess what happened.
            let mut failures = rollback_changes(backend, &journal);
            if !wrote {
                if let Some(original) = original {
                    match read_scope_value(backend, name, scope) {
                        Ok(current) if current == original => {},
                        _ => failures.push(format!(
                            "mutation outcome unknown for {name:?} in {scope:?}; current state preserved"
                        )),
                    }
                }
            }
            backend.broadcast_changes();
            return if failures.is_empty() {
                Err(error)
            } else {
                Err(EnvarlyError::InvalidInput(format!(
                    "apply failed: {error}; rollback details: {}",
                    failures.join("; ")
                )))
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
    if read_scope_value(backend, name, scope)?.as_ref() == expected {
        Ok(())
    } else {
        Err(EnvarlyError::InvalidInput(format!(
            "registry verification failed for {name:?}"
        )))
    }
}

fn read_scope_value(
    backend: &dyn EnvBackend,
    name: &str,
    scope: &VarScope,
) -> Result<Option<EnvValue>, EnvarlyError> {
    let values = match scope {
        VarScope::User => backend.read_user()?,
        VarScope::System => backend.read_system()?,
        VarScope::OtherUser => backend.read_other_user()?.unwrap_or_default(),
    };
    Ok(values
        .into_iter()
        .find(|(key, _)| names_equal(key, name))
        .map(|(_, value)| value))
}

struct RollbackEntry {
    name: String,
    scope: VarScope,
    before: Option<EnvValue>,
    expected: Option<EnvValue>,
}

fn names_equal(left: &str, right: &str) -> bool {
    #[cfg(windows)]
    {
        let left: Vec<u16> = left.encode_utf16().collect();
        let right: Vec<u16> = right.encode_utf16().collect();
        unsafe {
            windows_sys::Win32::Globalization::CompareStringOrdinal(
                left.as_ptr(),
                left.len() as i32,
                right.as_ptr(),
                right.len() as i32,
                1,
            ) == windows_sys::Win32::Globalization::CSTR_EQUAL
        }
    }
    #[cfg(not(windows))]
    {
        left.to_uppercase() == right.to_uppercase()
    }
}

fn rollback_changes(backend: &dyn EnvBackend, journal: &[RollbackEntry]) -> Vec<String> {
    let mut failures = Vec::new();
    let mut unresolved: Vec<(&VarScope, &str)> = Vec::new();
    for entry in journal.iter().rev() {
        if unresolved
            .iter()
            .any(|(scope, name)| **scope == entry.scope && names_equal(name, &entry.name))
        {
            continue;
        }
        let result = (|| {
            if read_scope_value(backend, &entry.name, &entry.scope)? != entry.expected {
                return Err(EnvarlyError::InvalidInput(format!(
                    "rollback conflict for {:?} in {:?}; current state preserved",
                    entry.name, entry.scope
                )));
            }
            match (&entry.scope, &entry.before) {
                (VarScope::User, Some(value)) => backend.write_user(&entry.name, value),
                (VarScope::System, Some(value)) => backend.write_system(&entry.name, value),
                (VarScope::OtherUser, Some(value)) => backend.write_other_user(&entry.name, value),
                (VarScope::User, None) => backend.delete_user(&entry.name),
                (VarScope::System, None) => backend.delete_system(&entry.name),
                (VarScope::OtherUser, None) => backend.delete_other_user(&entry.name),
            }?;
            verify_value(backend, &entry.name, &entry.scope, entry.before.as_ref())
        })();
        if let Err(error) = result {
            unresolved.push((&entry.scope, &entry.name));
            failures.push(format!("{:?} in {:?}: {error}", entry.name, entry.scope));
        }
    }
    failures
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
pub fn apply_changes(
    changes: &[EnvChange],
    on_progress: impl FnMut(usize, usize, &EnvChange, &Result<(), EnvarlyError>),
) -> Result<(), EnvarlyError> {
    apply_changes_with(&WinregBackend, changes, on_progress)
}

#[cfg(windows)]
pub fn is_elevated() -> bool {
    WinregBackend.is_elevated()
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    struct FaultBackend {
        inner: MemBackend,
        fail_read: std::sync::atomic::AtomicBool,
        fail_restore: bool,
    }

    impl EnvBackend for FaultBackend {
        fn read_user(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
            if self
                .fail_read
                .swap(false, std::sync::atomic::Ordering::SeqCst)
            {
                return Err(EnvarlyError::InvalidInput(
                    "injected verification read failure".into(),
                ));
            }
            self.inner.read_user()
        }
        fn read_system(&self) -> Result<HashMap<String, EnvValue>, EnvarlyError> {
            self.inner.read_system()
        }
        fn write_user(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
            if self.fail_restore && name == "B" && value.value == "original" {
                return Err(EnvarlyError::InvalidInput(
                    "injected restore failure".into(),
                ));
            }
            self.inner.write_user(name, value)?;
            if name == "VERIFY" && value.value == "changed" {
                self.fail_read
                    .store(true, std::sync::atomic::Ordering::SeqCst);
            }
            Ok(())
        }
        fn write_system(&self, name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
            self.inner.write_system(name, value)
        }
        fn delete_user(&self, name: &str) -> Result<(), EnvarlyError> {
            self.inner.delete_user(name)
        }
        fn delete_system(&self, name: &str) -> Result<(), EnvarlyError> {
            self.inner.delete_system(name)
        }
        fn is_elevated(&self) -> bool {
            self.inner.is_elevated()
        }
    }

    #[test]
    fn rollback_includes_a_write_whose_verification_read_failed() {
        let b = FaultBackend {
            inner: MemBackend::new().with_user([("VERIFY", "original")]),
            fail_read: false.into(),
            fail_restore: false,
        };
        let result = apply_changes_with(
            &b,
            &[EnvChange::Set {
                name: "VERIFY".into(),
                value: "changed".into(),
                value_kind: EnvValueKind::String,
                scope: VarScope::User,
            }],
            |_, _, _, _| {},
        );
        assert!(result.is_err());
        assert_eq!(b.read_user().unwrap()["VERIFY"].value, "original");
    }

    #[test]
    fn rollback_continues_after_a_restore_write_fails() {
        let b = FaultBackend {
            inner: MemBackend::new()
                .with_user([("A", "original"), ("B", "original")])
                .with_elevated(false),
            fail_read: false.into(),
            fail_restore: true,
        };
        let changes = ["A", "B", "DENIED"].map(|name| EnvChange::Set {
            name: name.into(),
            value: "changed".into(),
            value_kind: EnvValueKind::String,
            scope: if name == "DENIED" {
                VarScope::System
            } else {
                VarScope::User
            },
        });
        let error = apply_changes_with(&b, &changes, |_, _, _, _| {}).unwrap_err();
        assert!(error.to_string().contains("injected restore failure"));
        assert_eq!(b.read_user().unwrap()["A"].value, "original");
        assert_eq!(b.read_user().unwrap()["B"].value, "changed");
    }

    #[test]
    fn registry_lookup_ignores_name_case() {
        let b = MemBackend::new().with_user([("Path", "original"), ("Ä_VAR", "unicode")]);
        assert_eq!(
            read_scope_value(&b, "PATH", &VarScope::User)
                .unwrap()
                .unwrap()
                .value,
            "original"
        );
        assert_eq!(
            read_scope_value(&b, "ä_var", &VarScope::User)
                .unwrap()
                .unwrap()
                .value,
            "unicode"
        );
    }

    #[test]
    fn rollback_conflict_blocks_earlier_mutations_of_the_same_variable() {
        let b = MemBackend::new()
            .with_user([("A", "original")])
            .with_elevated(false);
        let changes = ["first", "second", "denied"].map(|value| EnvChange::Set {
            name: "A".into(),
            value: value.into(),
            value_kind: EnvValueKind::String,
            scope: if value == "denied" {
                VarScope::System
            } else {
                VarScope::User
            },
        });
        let result = apply_changes_with(&b, &changes, |index, _, _, _| {
            if index == 1 {
                b.write_user("A", &EnvValue::typed("first".into(), EnvValueKind::String))
                    .unwrap();
            }
        });
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("rollback conflict"));
        assert_eq!(b.read_user().unwrap()["A"].value, "first");
    }

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
    fn apply_preserves_types() {
        let b = backend().with_user([("EXPANDED", "%USERPROFILE%\\bin")]);
        apply_changes_with(
            &b,
            &[EnvChange::Set {
                name: "EXPANDED".into(),
                value: "%USERPROFILE%\\tools".into(),
                value_kind: EnvValueKind::ExpandString,
                scope: VarScope::User,
            }],
            |_, _, _, _| {},
        )
        .unwrap();

        let value = &read_snapshot_with(&b).unwrap().user["EXPANDED"];
        assert_eq!(value.value, "%USERPROFILE%\\tools");
        assert_eq!(value.kind, Some(EnvValueKind::ExpandString));
    }

    #[test]
    fn apply_rolls_back_prior_changes_after_failure() {
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
            |_, _, _, _| {},
        );

        assert!(result.is_err());
        assert_eq!(
            read_snapshot_with(&b).unwrap().user["KEEP"].value,
            "original"
        );
    }

    #[test]
    fn apply_reports_progress_for_each_change() {
        let b = backend();
        let mut seen: Vec<(usize, usize, bool)> = Vec::new();
        apply_changes_with(
            &b,
            &[
                EnvChange::Set {
                    name: "A".into(),
                    value: "1".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "B".into(),
                    value: "2".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::User,
                },
            ],
            |index, total, _change, result| seen.push((index, total, result.is_ok())),
        )
        .unwrap();

        assert_eq!(seen, vec![(0, 2, true), (1, 2, true)]);
    }

    #[test]
    fn rollback_preserves_unrelated_concurrent_changes() {
        let b = MemBackend::new()
            .with_user([("KEEP", "original"), ("B", "old"), ("C", "old")])
            .with_elevated(false);
        let result = apply_changes_with(
            &b,
            &[
                EnvChange::Set {
                    name: "KEEP".into(),
                    value: "changed".into(),
                    value_kind: EnvValueKind::ExpandString,
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "DENIED".into(),
                    value: "value".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::System,
                },
            ],
            |index, _, _, _| {
                if index == 0 {
                    b.write_user(
                        "NEW_TOOL",
                        &EnvValue::typed("external".into(), EnvValueKind::String),
                    )
                    .unwrap();
                    b.write_user(
                        "B",
                        &EnvValue::typed("external".into(), EnvValueKind::String),
                    )
                    .unwrap();
                    b.delete_user("C").unwrap();
                }
            },
        );
        assert!(result.is_err());
        let values = b.read_user().unwrap();
        assert_eq!(
            values["KEEP"],
            EnvValue::typed("original".into(), EnvValueKind::String)
        );
        assert_eq!(values["NEW_TOOL"].value, "external");
        assert_eq!(values["B"].value, "external");
        assert!(!values.contains_key("C"));
    }

    #[test]
    fn rollback_reports_conflicts_and_continues_restoring_other_entries() {
        let b = MemBackend::new()
            .with_user([("A", "original"), ("B", "original")])
            .with_elevated(false);
        let changes = ["A", "B", "DENIED"].map(|name| EnvChange::Set {
            name: name.into(),
            value: "changed".into(),
            value_kind: EnvValueKind::String,
            scope: if name == "DENIED" {
                VarScope::System
            } else {
                VarScope::User
            },
        });
        let error = apply_changes_with(&b, &changes, |index, _, _, _| {
            if index == 1 {
                b.write_user(
                    "B",
                    &EnvValue::typed("external".into(), EnvValueKind::String),
                )
                .unwrap();
            }
        })
        .unwrap_err();
        assert!(error.to_string().contains("rollback conflict"));
        let values = b.read_user().unwrap();
        assert_eq!(values["A"].value, "original");
        assert_eq!(values["B"].value, "external");
    }

    #[test]
    fn rollback_reverses_repeated_sets_additions_and_deletions() {
        let b = MemBackend::new()
            .with_user([("KEEP", "original")])
            .with_elevated(false);
        let baseline = b.read_user().unwrap();
        let result = apply_changes_with(
            &b,
            &[
                EnvChange::Delete {
                    name: "KEEP".into(),
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "KEEP".into(),
                    value: "replacement".into(),
                    value_kind: EnvValueKind::ExpandString,
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "NEW".into(),
                    value: "1".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::User,
                },
                EnvChange::Set {
                    name: "NEW".into(),
                    value: "2".into(),
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
            |_, _, _, _| {},
        );
        assert!(result.is_err());
        assert_eq!(b.read_user().unwrap(), baseline);
    }

    // --- VarScope::OtherUser dispatch ---

    #[test]
    fn no_other_user_selected_keeps_existing_behavior() {
        let b = backend().with_user([("MY_VAR", "hello")]);
        let vars = read_all_with(&b).unwrap();
        assert_eq!(vars.len(), 1);
        assert_eq!(vars[0].scope, VarScope::User);
    }

    #[test]
    fn other_user_selected_replaces_user_scope_in_switch_mode() {
        let b = MemBackend::new()
            .with_user([("MINE", "should not appear")])
            .with_other_user([("THEIRS", "hello")]);
        *b.system.lock().unwrap() = [(
            "SYS".to_string(),
            EnvValue::typed("world".to_string(), EnvValueKind::String),
        )]
        .into();
        let vars = read_all_with(&b).unwrap();
        let scopes: Vec<(&str, &VarScope)> =
            vars.iter().map(|v| (v.name.as_str(), &v.scope)).collect();
        assert_eq!(
            scopes,
            vec![("SYS", &VarScope::System), ("THEIRS", &VarScope::OtherUser)]
        );
    }

    #[test]
    fn write_and_read_other_user_var() {
        let b = MemBackend::new().with_other_user([]);
        write_var_with(
            &b,
            "MY_VAR",
            "hello",
            EnvValueKind::String,
            &VarScope::OtherUser,
        )
        .unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert_eq!(
            snap.other_user
                .unwrap()
                .get("MY_VAR")
                .map(|v| v.value.as_str()),
            Some("hello")
        );
    }

    #[test]
    fn write_other_user_var_without_selection_returns_error() {
        let b = MemBackend::new(); // no with_other_user() call — nothing selected
        let err = write_var_with(
            &b,
            "MY_VAR",
            "hello",
            EnvValueKind::String,
            &VarScope::OtherUser,
        )
        .unwrap_err();
        assert!(matches!(err, EnvarlyError::InvalidInput(_)));
    }

    #[test]
    fn delete_existing_other_user_var() {
        let b = MemBackend::new().with_other_user([("TO_DELETE", "v")]);
        delete_var_with(&b, "TO_DELETE", &VarScope::OtherUser).unwrap();
        let snap = read_snapshot_with(&b).unwrap();
        assert!(!snap.other_user.unwrap().contains_key("TO_DELETE"));
    }

    #[test]
    fn snapshot_omits_other_user_when_none_selected() {
        let b = backend().with_user([("MY_VAR", "hello")]);
        let snap = read_snapshot_with(&b).unwrap();
        assert!(snap.other_user.is_none());
    }

    #[test]
    fn apply_rolls_back_other_user_scope_after_failure() {
        let b = MemBackend::new()
            .with_other_user([("KEEP", "original")])
            .with_elevated(false); // System write below will fail, triggering rollback
        let result = apply_changes_with(
            &b,
            &[
                EnvChange::Set {
                    name: "KEEP".into(),
                    value: "changed".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::OtherUser,
                },
                EnvChange::Set {
                    name: "DENIED".into(),
                    value: "value".into(),
                    value_kind: EnvValueKind::String,
                    scope: VarScope::System,
                },
            ],
            |_, _, _, _| {},
        );

        assert!(result.is_err());
        assert_eq!(
            read_snapshot_with(&b).unwrap().other_user.unwrap()["KEEP"].value,
            "original"
        );
    }
}
