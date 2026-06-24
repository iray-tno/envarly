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

pub fn read_all() -> Result<Vec<EnvVar>, EnvarlyError> {
    let mut vars: Vec<EnvVar> = Vec::new();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let user_key = hkcu.open_subkey(USER_ENV_KEY)?;
    for (name, value) in iter_string_values(&user_key) {
        let is_path_like = is_path_list(&name, &value);
        vars.push(EnvVar { name, value, scope: VarScope::User, is_path_like });
    }

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let sys_key = hklm.open_subkey(SYSTEM_ENV_KEY)?;
    for (name, value) in iter_string_values(&sys_key) {
        let is_path_like = is_path_list(&name, &value);
        vars.push(EnvVar { name, value, scope: VarScope::System, is_path_like });
    }

    vars.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(vars)
}

pub fn read_snapshot() -> Result<EnvSnapshot, EnvarlyError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let user_key = hkcu.open_subkey(USER_ENV_KEY)?;
    let user: HashMap<String, String> = iter_string_values(&user_key).collect();

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let sys_key = hklm.open_subkey(SYSTEM_ENV_KEY)?;
    let system: HashMap<String, String> = iter_string_values(&sys_key).collect();

    Ok(EnvSnapshot { user, system })
}

pub fn write_var(name: &str, value: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    match scope {
        VarScope::User => {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let key = hkcu.open_subkey_with_flags(USER_ENV_KEY, KEY_SET_VALUE)?;
            key.set_value(name, &value)?;
        }
        VarScope::System => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let key = hklm.open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)?;
            key.set_value(name, &value)?;
        }
    }
    broadcast_settings_change();
    Ok(())
}

pub fn delete_var(name: &str, scope: &VarScope) -> Result<(), EnvarlyError> {
    match scope {
        VarScope::User => {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let key = hkcu.open_subkey_with_flags(USER_ENV_KEY, KEY_SET_VALUE)?;
            key.delete_value(name)?;
        }
        VarScope::System => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let key = hklm.open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)?;
            key.delete_value(name)?;
        }
    }
    broadcast_settings_change();
    Ok(())
}

/// Entries separated by `;` where at least one has a backslash → treat as a path list.
/// This correctly excludes PATHEXT (.COM;.EXE;.BAT) while keeping PATH and PSModulePath.
fn is_path_list(name: &str, value: &str) -> bool {
    if name.to_uppercase() == "PATH" {
        return true;
    }
    value.contains(';') && value.split(';').any(|part| part.contains('\\'))
}

/// Check whether the process has write access to HKLM (i.e. is elevated / admin).
pub fn is_elevated() -> bool {
    RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey_with_flags(SYSTEM_ENV_KEY, KEY_SET_VALUE)
        .is_ok()
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
