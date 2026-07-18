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
fn dir_exists(path: &str) -> bool {
    let wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
    let attrs =
        unsafe { windows_sys::Win32::Storage::FileSystem::GetFileAttributesW(wide.as_ptr()) };
    // INVALID_FILE_ATTRIBUTES = 0xFFFFFFFF means the call failed (path not found etc.)
    attrs != u32::MAX
}

#[cfg(not(windows))]
fn dir_exists(path: &str) -> bool {
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
/// scope: "User" | "System"
#[tauri::command]
pub fn get_path_proposal(scope: String) -> Result<Option<String>, EnvarlyError> {
    let user = match scope.as_str() {
        "User" => true,
        "System" => false,
        other => {
            return Err(EnvarlyError::InvalidInput(format!(
                "invalid scope: {other:?}"
            )))
        }
    };
    path_manage::propose_add(user)
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
        // Regression: unknown var must not stop expansion of subsequent known vars
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
        // System32 should always exist on Windows CI
        let results = validate_paths(vec!["C:\\Windows".to_string()]);
        // On non-Windows CI this might be false; guard the assertion
        if cfg!(target_os = "windows") {
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
