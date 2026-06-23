use std::collections::HashMap;

use crate::env_store::EnvSnapshot;
use crate::error::EnvarlyError;

/// Export snapshot as pretty-printed JSON.
/// scope: "User" | "System" | "All"
pub fn to_json(snapshot: &EnvSnapshot, scope: &str) -> String {
    let mut obj = serde_json::Map::new();
    if scope != "System" {
        obj.insert(
            "user".into(),
            serde_json::to_value(&snapshot.user).unwrap_or_default(),
        );
    }
    if scope != "User" {
        obj.insert(
            "system".into(),
            serde_json::to_value(&snapshot.system).unwrap_or_default(),
        );
    }
    serde_json::to_string_pretty(&serde_json::Value::Object(obj)).unwrap_or_default()
}

/// Export snapshot in Windows Registry .reg format.
/// scope: "User" | "System" | "All"
pub fn to_reg(snapshot: &EnvSnapshot, scope: &str) -> String {
    let mut out = String::from("Windows Registry Editor Version 5.00\r\n");
    if scope != "System" {
        out.push_str("\r\n[HKEY_CURRENT_USER\\Environment]\r\n");
        let mut pairs: Vec<_> = snapshot.user.iter().collect();
        pairs.sort_by_key(|(k, _)| k.to_lowercase());
        for (k, v) in pairs {
            out.push_str(&format!("\"{}\"=\"{}\"\r\n", reg_escape(k), reg_escape(v)));
        }
    }
    if scope != "User" {
        out.push_str(
            "\r\n[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment]\r\n",
        );
        let mut pairs: Vec<_> = snapshot.system.iter().collect();
        pairs.sort_by_key(|(k, _)| k.to_lowercase());
        for (k, v) in pairs {
            out.push_str(&format!("\"{}\"=\"{}\"\r\n", reg_escape(k), reg_escape(v)));
        }
    }
    out
}

fn reg_escape(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn reg_unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\' {
            match chars.next() {
                Some('\\') => out.push('\\'),
                Some('"') => out.push('"'),
                Some('n') => out.push('\n'),
                Some(other) => {
                    out.push('\\');
                    out.push(other);
                }
                None => out.push('\\'),
            }
        } else {
            out.push(c);
        }
    }
    out
}

/// Parse JSON export back into a snapshot. Does NOT write to the registry.
pub fn parse_json(content: &str) -> Result<EnvSnapshot, EnvarlyError> {
    let v: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| EnvarlyError::InvalidInput(format!("JSON parse error: {e}")))?;

    let as_map = |key: &str| -> HashMap<String, String> {
        v.get(key)
            .and_then(|o| o.as_object())
            .map(|m| {
                m.iter()
                    .filter_map(|(k, vv)| vv.as_str().map(|s| (k.clone(), s.to_owned())))
                    .collect()
            })
            .unwrap_or_default()
    };

    Ok(EnvSnapshot {
        user: as_map("user"),
        system: as_map("system"),
    })
}

/// Parse a .reg file back into a snapshot. Does NOT write to the registry.
pub fn parse_reg(content: &str) -> Result<EnvSnapshot, EnvarlyError> {
    let mut user: HashMap<String, String> = HashMap::new();
    let mut system: HashMap<String, String> = HashMap::new();
    let mut current: Option<bool> = None; // Some(true) = user env, Some(false) = system env

    for raw_line in content.lines() {
        let line = raw_line.trim_start_matches('\u{feff}').trim_end_matches('\r').trim();
        if line.is_empty() || line.starts_with(';') || line.starts_with("Windows Registry Editor") {
            continue;
        }
        if line.starts_with('[') {
            let lower = line.to_lowercase();
            if lower.contains("hkey_current_user\\environment") {
                current = Some(true);
            } else if lower.contains("session manager\\environment") {
                current = Some(false);
            } else {
                current = None;
            }
            continue;
        }
        if let Some(is_user) = current {
            if let Some((name, value)) = parse_reg_entry(line) {
                if is_user {
                    user.insert(name, value);
                } else {
                    system.insert(name, value);
                }
            }
        }
    }

    Ok(EnvSnapshot { user, system })
}

/// Parse a single `"name"="value"` registry entry line.
fn parse_reg_entry(line: &str) -> Option<(String, String)> {
    if !line.starts_with('"') {
        return None; // skip non-string values (dword, binary, etc.)
    }
    let after_open = &line[1..]; // skip leading "
    let (name_raw, after_name) = split_at_unescaped_quote(after_open)?;
    let after_eq = after_name.strip_prefix("=\"")?;
    let (value_raw, _) = split_at_unescaped_quote(after_eq)?;
    Some((reg_unescape(name_raw), reg_unescape(value_raw)))
}

/// Returns (before_quote, after_quote) split at the first unescaped `"`.
fn split_at_unescaped_quote(s: &str) -> Option<(&str, &str)> {
    let mut escaped = false;
    for (i, c) in s.char_indices() {
        if escaped {
            escaped = false;
        } else if c == '\\' {
            escaped = true;
        } else if c == '"' {
            return Some((&s[..i], &s[i + 1..]));
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> EnvSnapshot {
        EnvSnapshot {
            user: [
                ("PATH".to_string(), "C:\\bin;C:\\tools".to_string()),
                ("JAVA_HOME".to_string(), "C:\\jdk21".to_string()),
            ]
            .into(),
            system: [
                ("WINDIR".to_string(), "C:\\Windows".to_string()),
                ("OS".to_string(), "Windows_NT".to_string()),
            ]
            .into(),
        }
    }

    // ── JSON ──────────────────────────────────────────────────────────────

    #[test]
    fn json_roundtrip_all() {
        let snap = fixture();
        let json = to_json(&snap, "All");
        let parsed = parse_json(&json).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert_eq!(parsed.system, snap.system);
    }

    #[test]
    fn json_roundtrip_user_only() {
        let snap = fixture();
        let parsed = parse_json(&to_json(&snap, "User")).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert!(parsed.system.is_empty());
    }

    #[test]
    fn json_roundtrip_system_only() {
        let snap = fixture();
        let parsed = parse_json(&to_json(&snap, "System")).unwrap();
        assert!(parsed.user.is_empty());
        assert_eq!(parsed.system, snap.system);
    }

    #[test]
    fn json_invalid_returns_error() {
        assert!(parse_json("not json at all").is_err());
    }

    #[test]
    fn json_missing_sections_gives_empty_maps() {
        let parsed = parse_json("{}").unwrap();
        assert!(parsed.user.is_empty());
        assert!(parsed.system.is_empty());
    }

    // ── REG ───────────────────────────────────────────────────────────────

    #[test]
    fn reg_roundtrip_all() {
        let snap = fixture();
        let parsed = parse_reg(&to_reg(&snap, "All")).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert_eq!(parsed.system, snap.system);
    }

    #[test]
    fn reg_roundtrip_user_only() {
        let snap = fixture();
        let parsed = parse_reg(&to_reg(&snap, "User")).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert!(parsed.system.is_empty());
    }

    #[test]
    fn reg_escape_backslash_roundtrip() {
        let snap = EnvSnapshot {
            user: [("X".to_string(), "C:\\foo\\bar".to_string())].into(),
            system: Default::default(),
        };
        let parsed = parse_reg(&to_reg(&snap, "User")).unwrap();
        assert_eq!(parsed.user["X"], "C:\\foo\\bar");
    }

    #[test]
    fn reg_escape_quote_roundtrip() {
        let snap = EnvSnapshot {
            user: [("X".to_string(), r#"say "hello""#.to_string())].into(),
            system: Default::default(),
        };
        let parsed = parse_reg(&to_reg(&snap, "User")).unwrap();
        assert_eq!(parsed.user["X"], r#"say "hello""#);
    }

    #[test]
    fn reg_ignores_unrelated_sections() {
        let content = "Windows Registry Editor Version 5.00\r\n\
                       \r\n[HKEY_LOCAL_MACHINE\\SOFTWARE\\SomeApp]\r\n\
                       \"key\"=\"value\"\r\n";
        let parsed = parse_reg(content).unwrap();
        assert!(parsed.user.is_empty());
        assert!(parsed.system.is_empty());
    }

    #[test]
    fn reg_skips_non_string_values() {
        let content = "Windows Registry Editor Version 5.00\r\n\
                       \r\n[HKEY_CURRENT_USER\\Environment]\r\n\
                       \"PATH\"=\"C:\\\\bin\"\r\n\
                       \"DWORD_VAL\"=dword:00000001\r\n";
        let parsed = parse_reg(content).unwrap();
        assert_eq!(parsed.user["PATH"], "C:\\bin");
        assert!(!parsed.user.contains_key("DWORD_VAL"));
    }
}
