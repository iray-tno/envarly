use crate::error::EnvarlyError;
use crate::path_manage;

#[tauri::command]
pub fn validate_paths(paths: Vec<String>) -> Vec<bool> {
    paths
        .iter()
        .map(|p| {
            let cleaned = p.trim_matches(|c: char| c.is_whitespace() || c == '\0');
            let expanded = expand_env_vars(cleaned);
            dir_exists(&expanded)
        })
        .collect()
}

/// Check whether a directory path exists using GetFileAttributesW directly.
/// This matches PowerShell's Test-Path behavior and avoids false negatives
/// that Rust's Path::exists() (which uses GetFileAttributesExW) can produce
/// under certain Windows filesystem filter drivers or security software.
#[cfg(windows)]
pub(crate) fn dir_exists(path: &str) -> bool {
    let wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
    let attrs =
        unsafe { windows_sys::Win32::Storage::FileSystem::GetFileAttributesW(wide.as_ptr()) };
    if attrs != u32::MAX {
        return true;
    }
    // INVALID_FILE_ATTRIBUTES: could mean "not found" or "access denied" (e.g. a
    // path under another account's profile, like SYSTEM's WindowsApps folder in
    // the default System PATH). Access denied only happens for paths that exist,
    // so treat it as present rather than reporting a false "missing" entry.
    let err = unsafe { windows_sys::Win32::Foundation::GetLastError() };
    err == windows_sys::Win32::Foundation::ERROR_ACCESS_DENIED
}

#[cfg(not(windows))]
pub(crate) fn dir_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

pub(crate) fn expand_env_vars(s: &str) -> String {
    let mut result = String::new();
    let mut rest = s;
    while !rest.is_empty() {
        match rest.find('%') {
            None => {
                result.push_str(rest);
                break;
            }
            Some(start) => {
                result.push_str(&rest[..start]);
                rest = &rest[start + 1..];
                match rest.find('%') {
                    None => {
                        // Unmatched % at end of string — keep as-is
                        result.push('%');
                        result.push_str(rest);
                        break;
                    }
                    Some(end) => {
                        let var_name = &rest[..end];
                        rest = &rest[end + 1..];
                        if var_name.is_empty() {
                            // %% → literal %
                            result.push('%');
                        } else if let Ok(val) = std::env::var(var_name) {
                            result.push_str(&val);
                        } else {
                            // Unknown var: keep as-is and continue scanning
                            result.push('%');
                            result.push_str(var_name);
                            result.push('%');
                        }
                    }
                }
            }
        }
    }
    result
}

/// Returns whether the install directory is currently in User / System PATH.
#[tauri::command]
pub fn get_path_status() -> path_manage::PathStatus {
    path_manage::path_status()
}

/// Returns the proposed new PATH value (with envarly added) for the given scope,
/// or None if the install directory is already present.
/// scope: "User" | "System" | "OtherUser"
#[tauri::command]
pub fn get_path_proposal(scope: String) -> Result<Option<String>, EnvarlyError> {
    match scope.as_str() {
        "User" => path_manage::propose_add(true),
        "System" => path_manage::propose_add(false),
        "OtherUser" => path_manage::propose_add_for_other_user(),
        other => Err(EnvarlyError::InvalidInput(format!(
            "invalid scope: {other:?}"
        ))),
    }
}

/// Checks whether `input` (a command name or full exe path) resolves via the
/// effective PATH, and whether it's shadowed by another same-named file.
#[tauri::command]
pub fn check_command(input: String) -> Result<path_manage::CheckCommandResult, EnvarlyError> {
    path_manage::check_command(&input)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expand_no_vars() {
        assert_eq!(
            expand_env_vars("C:\\Windows\\System32"),
            "C:\\Windows\\System32"
        );
    }

    #[test]
    fn expand_known_var() {
        std::env::set_var("_TEST_EXPAND_VAR", "hello");
        let result = expand_env_vars("%_TEST_EXPAND_VAR%\\sub");
        assert_eq!(result, "hello\\sub");
        std::env::remove_var("_TEST_EXPAND_VAR");
    }

    #[test]
    fn expand_unknown_var_passthrough() {
        let input = "%DOES_NOT_EXIST_ZZZ%";
        let result = expand_env_vars(input);
        assert_eq!(result, input);
    }

    #[test]
    fn expand_continues_after_unknown_var() {
        // Unknown variables are preserved while continuing expansion of subsequent variables
        std::env::set_var("_TEST_EXPAND_KNOWN", "found");
        let result = expand_env_vars("%_UNKNOWN_ZZZ_%\\%_TEST_EXPAND_KNOWN%");
        assert_eq!(result, "%_UNKNOWN_ZZZ_%\\found");
        std::env::remove_var("_TEST_EXPAND_KNOWN");
    }

    #[test]
    fn expand_multiple_sequential_known_vars() {
        std::env::set_var("_TEST_EXPAND_A", "alpha");
        std::env::set_var("_TEST_EXPAND_B", "beta");
        let result = expand_env_vars("%_TEST_EXPAND_A%\\%_TEST_EXPAND_B%");
        assert_eq!(result, "alpha\\beta");
        std::env::remove_var("_TEST_EXPAND_A");
        std::env::remove_var("_TEST_EXPAND_B");
    }

    #[test]
    fn expand_double_percent_yields_literal_percent() {
        assert_eq!(expand_env_vars("100%%"), "100%");
        assert_eq!(expand_env_vars("100%%done"), "100%done");
    }

    #[test]
    fn expand_unmatched_percent_at_end() {
        assert_eq!(expand_env_vars("value%"), "value%");
    }

    #[test]
    fn validate_paths_existing() {
        let results = validate_paths(vec!["C:\\Windows".to_string()]);
        if cfg!(target_os = "windows") {
            assert_eq!(results, vec![true]);
        }
    }

    #[test]
    fn dir_exists_treats_access_denied_as_present() {
        // The SYSTEM account's own profile is a real, standard directory on every
        // Windows install, but a regular (even Administrator) account gets
        // ERROR_ACCESS_DENIED trying to stat it — must not be reported as missing.
        if cfg!(target_os = "windows") {
            let results = validate_paths(vec![
                "C:\\Windows\\System32\\config\\systemprofile".to_string()
            ]);
            assert_eq!(results, vec![true]);
        }
    }

    #[test]
    fn validate_paths_nonexistent() {
        let results = validate_paths(vec!["C:\\ZZZ_DOES_NOT_EXIST_PATH_XYZ".to_string()]);
        assert_eq!(results, vec![false]);
    }

    #[test]
    fn validate_paths_empty_list() {
        let results = validate_paths(vec![]);
        assert!(results.is_empty());
    }
}
