//! Windows registry access for the PATH environment variable.

use winreg::enums::*;
use winreg::RegKey;

use crate::error::EnvarlyError;

const USER_ENV_KEY: &str = "Environment";
const SYSTEM_ENV_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";
const PATH_NAME: &str = "Path";

pub(crate) fn open_path_key(user: bool, write: bool) -> Result<RegKey, EnvarlyError> {
    if user {
        let flags = if write {
            KEY_SET_VALUE | KEY_QUERY_VALUE
        } else {
            KEY_QUERY_VALUE
        };
        RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey_with_flags(USER_ENV_KEY, flags)
            .map_err(EnvarlyError::Registry)
    } else {
        let flags = if write {
            KEY_SET_VALUE | KEY_QUERY_VALUE
        } else {
            KEY_QUERY_VALUE
        };
        RegKey::predef(HKEY_LOCAL_MACHINE)
            .open_subkey_with_flags(SYSTEM_ENV_KEY, flags)
            .map_err(EnvarlyError::Registry)
    }
}

pub(crate) fn read_path_str(key: &RegKey) -> String {
    // PATH is REG_EXPAND_SZ; winreg's get_raw_value gives us raw bytes
    key.get_raw_value(PATH_NAME)
        .map(|rv| {
            let words: Vec<u16> = rv
                .bytes
                .chunks_exact(2)
                .map(|c| u16::from_le_bytes([c[0], c[1]]))
                .take_while(|&w| w != 0)
                .collect();
            String::from_utf16_lossy(&words).to_string()
        })
        .unwrap_or_default()
}

pub(crate) fn write_path_str(key: &RegKey, value: &str) -> Result<(), EnvarlyError> {
    // Preserve REG_EXPAND_SZ so existing %SystemRoot% entries keep working
    let vtype = key
        .get_raw_value(PATH_NAME)
        .map(|rv| rv.vtype)
        .unwrap_or(winreg::enums::RegType::REG_EXPAND_SZ);
    let mut bytes: Vec<u8> = value.encode_utf16().flat_map(|w| w.to_le_bytes()).collect();
    bytes.extend([0u8, 0u8]); // null terminator
    key.set_raw_value(
        PATH_NAME,
        &winreg::RegValue {
            bytes: bytes.into(),
            vtype,
        },
    )
    .map_err(EnvarlyError::Registry)
}

/// Read-only PATH access for the currently-selected other-user account, kept
/// separate from `open_path_key` (HKCU/HKLM) by design — see `user_hive`'s
/// module doc for why the two are never unified. `Ok(None)` means no account
/// is active. Writing "Path" for that account goes through the generic
/// `VarScope::OtherUser` dispatch in `env_store.rs` like any other variable —
/// there's no separate write path here.
pub(crate) fn read_other_user_path() -> Result<Option<String>, EnvarlyError> {
    crate::user_hive::with_active_environment_key(false, |key| Ok(read_path_str(key)))
}
