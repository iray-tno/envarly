//! Loading and enumerating other local accounts' registry hives (`HKEY_USERS`).
//!
//! This is a deliberately separate, additive module from `env_backend.rs`:
//! the existing HKCU/HKLM read-write code paths must not change behavior at
//! all when no other-user account is selected, and the new Win32 surface
//! here (RegLoadKey/RegUnLoadKey, privilege enabling, account enumeration)
//! is inherently riskier, so it stays isolated rather than unified with it.

use std::collections::HashMap;
use std::sync::Mutex;

use winreg::enums::*;
use winreg::RegKey;

use crate::error::EnvarlyError;
use crate::model::EnvValue;

const PROFILE_LIST_KEY: &str = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList";
const WELL_KNOWN_SIDS: &[&str] = &["S-1-5-18", "S-1-5-19", "S-1-5-20"];

#[derive(Debug, Clone, serde::Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LocalAccount {
    pub sid: String,
    pub username: String,
    pub has_profile: bool,
    pub currently_logged_in: bool,
}

struct ActiveHive {
    account: LocalAccount,
    guard: HiveGuard,
}

static ACTIVE_HIVE: Mutex<Option<ActiveHive>> = Mutex::new(None);

/// Enumerate local Windows accounts, excluding the current user and
/// well-known non-interactive service SIDs. Only `has_profile` accounts can
/// actually have their variables loaded (an account that has never logged
/// in has no `NTUSER.DAT` to load).
pub fn list_local_accounts() -> Result<Vec<LocalAccount>, EnvarlyError> {
    let current_sid = current_user_sid()?;
    let mut accounts = Vec::new();
    for username in net_user_enum()? {
        let Ok(sid) = lookup_account_sid(&username) else {
            continue; // can't resolve a SID for this account; skip it
        };
        if sid == current_sid || WELL_KNOWN_SIDS.contains(&sid.as_str()) {
            continue;
        }
        accounts.push(LocalAccount {
            has_profile: profile_image_path(&sid).is_some(),
            currently_logged_in: hkey_users_subkey_exists(&sid),
            sid,
            username,
        });
    }
    accounts.sort_by_key(|a| a.username.to_lowercase());
    Ok(accounts)
}

/// Switch the active other-user hive. `None` deselects (unloading whatever
/// hive Envarly itself loaded). Replacing an already-active selection
/// unloads the previous one first.
pub fn select_account(sid: Option<&str>) -> Result<Option<LocalAccount>, EnvarlyError> {
    let mut active = ACTIVE_HIVE.lock().unwrap();
    *active = None; // drop first: unloads whatever hive we owned, if any

    let Some(sid) = sid else {
        return Ok(None);
    };

    let account = list_local_accounts()?
        .into_iter()
        .find(|a| a.sid == sid)
        .ok_or_else(|| EnvarlyError::OtherUserAccount(format!("unknown account {sid:?}")))?;
    if !account.has_profile {
        return Err(EnvarlyError::OtherUserAccount(format!(
            "{} has no profile on this machine yet",
            account.username
        )));
    }

    let guard = HiveGuard::load(&account.sid)?;
    let result = account.clone();
    *active = Some(ActiveHive { account, guard });
    Ok(Some(result))
}

pub fn selected_account() -> Option<LocalAccount> {
    ACTIVE_HIVE
        .lock()
        .unwrap()
        .as_ref()
        .map(|a| a.account.clone())
}

/// Run `f` against the currently active hive's `Environment` key, if any.
/// Returns `Ok(None)` when nothing is selected — callers use this to make
/// other-user reads a no-op rather than an error when there's no context.
pub fn with_active_environment_key<T>(
    write: bool,
    f: impl FnOnce(&RegKey) -> Result<T, EnvarlyError>,
) -> Result<Option<T>, EnvarlyError> {
    let active = ACTIVE_HIVE.lock().unwrap();
    let Some(active) = active.as_ref() else {
        return Ok(None);
    };
    let flags = if write { KEY_SET_VALUE } else { KEY_READ };
    let key = active
        .guard
        .root
        .open_subkey_with_flags("Environment", flags)?;
    f(&key).map(Some)
}

pub fn read_other_user_vars() -> Result<Option<HashMap<String, EnvValue>>, EnvarlyError> {
    with_active_environment_key(false, |key| {
        Ok(crate::env_backend::iter_string_values(key).collect())
    })
}

pub fn write_other_user_var(name: &str, value: &EnvValue) -> Result<(), EnvarlyError> {
    with_active_environment_key(true, |key| {
        key.set_raw_value(name, &crate::env_backend::to_reg_value(value)?)?;
        Ok(())
    })?
    .ok_or_else(|| EnvarlyError::OtherUserAccount("no other-user account selected".into()))
}

pub fn delete_other_user_var(name: &str) -> Result<(), EnvarlyError> {
    with_active_environment_key(true, |key| {
        key.delete_value(name)?;
        Ok(())
    })?
    .ok_or_else(|| EnvarlyError::OtherUserAccount("no other-user account selected".into()))
}

/// RAII guard around a loaded (or already-loaded) `HKEY_USERS\<sid>` hive.
/// Unloads it on drop, but only if this guard is the one that loaded it —
/// an already-logged-in account's hive is left alone (some other process,
/// namely the logon session, owns its lifetime).
struct HiveGuard {
    root: RegKey,
    owns_load: bool,
    sid: String,
}

impl HiveGuard {
    fn load(sid: &str) -> Result<Self, EnvarlyError> {
        if hkey_users_subkey_exists(sid) {
            let root = RegKey::predef(HKEY_USERS).open_subkey(sid)?;
            return Ok(Self {
                root,
                owns_load: false,
                sid: sid.to_string(),
            });
        }

        let profile_path = profile_image_path(sid)
            .ok_or_else(|| EnvarlyError::OtherUserAccount(format!("no profile found for {sid}")))?;
        let ntuser_dat = format!("{profile_path}\\NTUSER.DAT");
        ensure_backup_restore_privileges()?;
        reg_load_key(sid, &ntuser_dat)?;

        let root = RegKey::predef(HKEY_USERS).open_subkey(sid)?;
        Ok(Self {
            root,
            owns_load: true,
            sid: sid.to_string(),
        })
    }
}

impl Drop for HiveGuard {
    fn drop(&mut self) {
        if self.owns_load {
            if let Err(err) = reg_unload_key(&self.sid) {
                eprintln!("envarly: failed to unload hive for {}: {err}", self.sid);
            }
        }
    }
}

/// Unload whatever other-user hive Envarly currently owns, if any. Called on
/// app exit so a crash-free shutdown never leaves a hive loaded.
pub fn unload_active_hive() {
    *ACTIVE_HIVE.lock().unwrap() = None;
}

fn hkey_users_subkey_exists(sid: &str) -> bool {
    RegKey::predef(HKEY_USERS).open_subkey(sid).is_ok()
}

fn profile_image_path(sid: &str) -> Option<String> {
    let key = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey(format!("{PROFILE_LIST_KEY}\\{sid}"))
        .ok()?;
    key.get_value("ProfileImagePath").ok()
}

// ---------------------------------------------------------------------------
// Raw Win32 calls
// ---------------------------------------------------------------------------

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

fn current_user_sid() -> Result<String, EnvarlyError> {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::Security::{GetTokenInformation, TokenUser, TOKEN_QUERY, TOKEN_USER};
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token = std::ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
            return Err(std::io::Error::last_os_error().into());
        }
        let mut needed = 0u32;
        GetTokenInformation(token, TokenUser, std::ptr::null_mut(), 0, &mut needed);
        let mut buf = vec![0u8; needed as usize];
        let ok = GetTokenInformation(
            token,
            TokenUser,
            buf.as_mut_ptr() as *mut _,
            needed,
            &mut needed,
        );
        CloseHandle(token);
        if ok == 0 {
            return Err(std::io::Error::last_os_error().into());
        }
        let token_user = &*(buf.as_ptr() as *const TOKEN_USER);
        sid_to_string(token_user.User.Sid)
    }
}

fn sid_to_string(sid: *mut core::ffi::c_void) -> Result<String, EnvarlyError> {
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Authorization::ConvertSidToStringSidW;

    unsafe {
        let mut ptr: *mut u16 = std::ptr::null_mut();
        if ConvertSidToStringSidW(sid, &mut ptr) == 0 {
            return Err(std::io::Error::last_os_error().into());
        }
        let s = pwstr_to_string(ptr);
        LocalFree(ptr as *mut _);
        Ok(s)
    }
}

unsafe fn pwstr_to_string(ptr: *const u16) -> String {
    let mut len = 0usize;
    while *ptr.add(len) != 0 {
        len += 1;
    }
    String::from_utf16_lossy(std::slice::from_raw_parts(ptr, len))
}

fn net_user_enum() -> Result<Vec<String>, EnvarlyError> {
    use windows_sys::Win32::NetworkManagement::NetManagement::{
        NetApiBufferFree, NetUserEnum, FILTER_NORMAL_ACCOUNT, MAX_PREFERRED_LENGTH, USER_INFO_0,
    };

    unsafe {
        let mut buf: *mut u8 = std::ptr::null_mut();
        let mut entries_read = 0u32;
        let mut total_entries = 0u32;
        let mut resume_handle = 0u32;
        let status = NetUserEnum(
            std::ptr::null(),
            0,
            FILTER_NORMAL_ACCOUNT,
            &mut buf,
            MAX_PREFERRED_LENGTH,
            &mut entries_read,
            &mut total_entries,
            &mut resume_handle,
        );
        if status != 0 {
            return Err(std::io::Error::from_raw_os_error(status as i32).into());
        }
        let entries = std::slice::from_raw_parts(buf as *const USER_INFO_0, entries_read as usize);
        let names = entries
            .iter()
            .map(|entry| pwstr_to_string(entry.usri0_name))
            .collect();
        NetApiBufferFree(buf as *mut _);
        Ok(names)
    }
}

fn lookup_account_sid(username: &str) -> Result<String, EnvarlyError> {
    use windows_sys::Win32::Security::LookupAccountNameW;

    let wide_name = wide(username);
    unsafe {
        let mut sid_size = 0u32;
        let mut domain_size = 0u32;
        let mut use_ = 0i32;
        LookupAccountNameW(
            std::ptr::null(),
            wide_name.as_ptr(),
            std::ptr::null_mut(),
            &mut sid_size,
            std::ptr::null_mut(),
            &mut domain_size,
            &mut use_,
        );
        let mut sid_buf = vec![0u8; sid_size as usize];
        let mut domain_buf = vec![0u16; domain_size as usize];
        let ok = LookupAccountNameW(
            std::ptr::null(),
            wide_name.as_ptr(),
            sid_buf.as_mut_ptr() as *mut _,
            &mut sid_size,
            domain_buf.as_mut_ptr(),
            &mut domain_size,
            &mut use_,
        );
        if ok == 0 {
            return Err(std::io::Error::last_os_error().into());
        }
        sid_to_string(sid_buf.as_mut_ptr() as *mut _)
    }
}

fn ensure_backup_restore_privileges() -> Result<(), EnvarlyError> {
    use windows_sys::Win32::Foundation::{CloseHandle, LUID};
    use windows_sys::Win32::Security::{
        AdjustTokenPrivileges, LookupPrivilegeValueW, LUID_AND_ATTRIBUTES, SE_PRIVILEGE_ENABLED,
        TOKEN_ADJUST_PRIVILEGES, TOKEN_PRIVILEGES,
    };
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    unsafe {
        let mut token = std::ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES, &mut token) == 0 {
            return Err(std::io::Error::last_os_error().into());
        }

        for name in ["SeBackupPrivilege", "SeRestorePrivilege"] {
            let mut luid: LUID = std::mem::zeroed();
            if LookupPrivilegeValueW(std::ptr::null(), wide(name).as_ptr(), &mut luid) == 0 {
                CloseHandle(token);
                return Err(std::io::Error::last_os_error().into());
            }
            let privs = TOKEN_PRIVILEGES {
                PrivilegeCount: 1,
                Privileges: [LUID_AND_ATTRIBUTES {
                    Luid: luid,
                    Attributes: SE_PRIVILEGE_ENABLED,
                }],
            };
            if AdjustTokenPrivileges(
                token,
                0,
                &privs,
                0,
                std::ptr::null_mut(),
                std::ptr::null_mut(),
            ) == 0
            {
                CloseHandle(token);
                return Err(std::io::Error::last_os_error().into());
            }
        }
        CloseHandle(token);
    }
    Ok(())
}

fn reg_load_key(sid: &str, file_path: &str) -> Result<(), EnvarlyError> {
    use windows_sys::Win32::System::Registry::RegLoadKeyW;

    let hku = RegKey::predef(HKEY_USERS).raw_handle();
    let status = unsafe { RegLoadKeyW(hku, wide(sid).as_ptr(), wide(file_path).as_ptr()) };
    if status != 0 {
        return Err(EnvarlyError::OtherUserAccount(format!(
            "could not load profile hive ({}): {}",
            file_path,
            std::io::Error::from_raw_os_error(status as i32)
        )));
    }
    Ok(())
}

fn reg_unload_key(sid: &str) -> Result<(), EnvarlyError> {
    use windows_sys::Win32::System::Registry::RegUnLoadKeyW;

    let hku = RegKey::predef(HKEY_USERS).raw_handle();
    let status = unsafe { RegUnLoadKeyW(hku, wide(sid).as_ptr()) };
    if status != 0 {
        return Err(std::io::Error::from_raw_os_error(status as i32).into());
    }
    Ok(())
}

#[cfg(test)]
mod manual_smoke_tests {
    use super::*;

    /// Not run in CI (depends on this machine's actual local accounts) — run
    /// explicitly with `cargo test -- --ignored --nocapture` to manually
    /// verify the real Win32 calls (NetUserEnum/LookupAccountNameW/SID
    /// resolution/ProfileList lookup/HKEY_USERS enumeration) against the
    /// current machine as part of Phase 1 verification.
    #[test]
    #[ignore]
    fn list_and_select_real_accounts() {
        let accounts = list_local_accounts().expect("list_local_accounts should not error");
        println!("current_user_sid = {:?}", current_user_sid());
        for account in &accounts {
            println!("{account:?}");
        }

        let Some(candidate) = accounts.iter().find(|a| a.has_profile) else {
            println!("no other account with a profile on this machine — nothing further to test");
            return;
        };

        println!("selecting {candidate:?}");
        let selected = select_account(Some(&candidate.sid)).expect("select_account failed");
        println!("selected = {selected:?}");
        assert_eq!(selected.as_ref().map(|a| &a.sid), Some(&candidate.sid));

        let vars = read_other_user_vars().expect("read_other_user_vars failed");
        println!("vars = {vars:?}");
        assert!(vars.is_some());

        select_account(None).expect("deselect failed");
        assert!(selected_account().is_none());
        println!("deselected cleanly");
    }
}
