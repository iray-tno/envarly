//! Windows registry implementation of `EnvBackend`.

use std::collections::HashMap;
use winreg::enums::*;
use winreg::{RegKey, RegValue};

use crate::env_store::EnvBackend;
use crate::error::EnvarlyError;
use crate::model::{EnvValue, EnvValueKind, UnsupportedEnvValue, VarScope};

const USER_ENV_KEY: &str = "Environment";
const SYSTEM_ENV_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";

pub struct WinregBackend;

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
