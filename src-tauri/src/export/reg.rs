use std::collections::HashMap;

use super::ExportScope;
use crate::error::EnvarlyError;
use crate::model::{EnvSnapshot, EnvValue, EnvValueKind};

/// Export snapshot in Windows Registry .reg format.
pub fn to_reg(snapshot: &EnvSnapshot, scope: ExportScope) -> String {
    let mut out = String::from("Windows Registry Editor Version 5.00\r\n");
    if scope.includes_user() {
        out.push_str("\r\n[HKEY_CURRENT_USER\\Environment]\r\n");
        let mut pairs: Vec<_> = snapshot.user.iter().collect();
        pairs.sort_by_key(|(k, _)| k.to_lowercase());
        for (k, v) in pairs {
            out.push_str(&reg_entry(k, v));
        }
    }
    if scope.includes_system() {
        out.push_str(
            "\r\n[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment]\r\n",
        );
        let mut pairs: Vec<_> = snapshot.system.iter().collect();
        pairs.sort_by_key(|(k, _)| k.to_lowercase());
        for (k, v) in pairs {
            out.push_str(&reg_entry(k, v));
        }
    }
    out
}

fn reg_escape(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn reg_entry(name: &str, value: &EnvValue) -> String {
    match value.kind {
        Some(EnvValueKind::ExpandString) => {
            let bytes = value
                .value
                .encode_utf16()
                .chain(std::iter::once(0))
                .flat_map(u16::to_le_bytes)
                .map(|byte| format!("{byte:02x}"))
                .collect::<Vec<_>>()
                .join(",");
            format!("\"{}\"=hex(2):{bytes}\r\n", reg_escape(name))
        }
        _ => format!(
            "\"{}\"=\"{}\"\r\n",
            reg_escape(name),
            reg_escape(&value.value)
        ),
    }
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

/// Parse a .reg file back into a snapshot. Does NOT write to the registry.
pub fn parse_reg(content: &str) -> Result<EnvSnapshot, EnvarlyError> {
    let mut user: HashMap<String, EnvValue> = HashMap::new();
    let mut system: HashMap<String, EnvValue> = HashMap::new();
    let mut current: Option<bool> = None; // Some(true) = user env, Some(false) = system env

    for raw_line in reg_logical_lines(content) {
        let line = raw_line
            .trim_start_matches('\u{feff}')
            .trim_end_matches('\r')
            .trim();
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

fn reg_logical_lines(content: &str) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();
    for raw in content.lines() {
        let line = raw
            .trim_start_matches('\u{feff}')
            .trim_end_matches('\r')
            .trim();
        let continues = line.ends_with('\\');
        current.push_str(line.trim_end_matches('\\').trim_end());
        if !continues {
            lines.push(std::mem::take(&mut current));
        }
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

/// Parse a single `"name"="value"` registry entry line.
fn parse_reg_entry(line: &str) -> Option<(String, EnvValue)> {
    if !line.starts_with('"') {
        return None; // skip non-string values (dword, binary, etc.)
    }
    let after_open = &line[1..]; // skip leading "
    let (name_raw, after_name) = split_at_unescaped_quote(after_open)?;
    if let Some(after_eq) = after_name.strip_prefix("=\"") {
        let (value_raw, _) = split_at_unescaped_quote(after_eq)?;
        return Some((
            reg_unescape(name_raw),
            EnvValue::typed(reg_unescape(value_raw), EnvValueKind::String),
        ));
    }
    if after_name.len() < "=hex(2):".len()
        || !after_name[.."=hex(2):".len()].eq_ignore_ascii_case("=hex(2):")
    {
        return None;
    }
    let bytes = &after_name["=hex(2):".len()..];
    let raw = bytes
        .split(',')
        .map(|part| u8::from_str_radix(part.trim(), 16).ok())
        .collect::<Option<Vec<_>>>()?;
    if raw.len() % 2 != 0 {
        return None;
    }
    let mut units: Vec<u16> = raw
        .chunks_exact(2)
        .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
        .collect();
    if units.last() == Some(&0) {
        units.pop();
    }
    Some((
        reg_unescape(name_raw),
        EnvValue::typed(String::from_utf16(&units).ok()?, EnvValueKind::ExpandString),
    ))
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

    fn string(value: &str) -> EnvValue {
        EnvValue::typed(value.to_string(), EnvValueKind::String)
    }

    fn expandable(value: &str) -> EnvValue {
        EnvValue::typed(value.to_string(), EnvValueKind::ExpandString)
    }

    fn fixture() -> EnvSnapshot {
        EnvSnapshot {
            user: [
                (
                    "PATH".to_string(),
                    expandable("%USERPROFILE%\\bin;C:\\tools"),
                ),
                ("JAVA_HOME".to_string(), string("C:\\jdk21")),
            ]
            .into(),
            system: [
                ("WINDIR".to_string(), string("C:\\Windows")),
                ("OS".to_string(), string("Windows_NT")),
            ]
            .into(),
        }
    }

    #[test]
    fn reg_roundtrip_all() {
        let snap = fixture();
        let parsed = parse_reg(&to_reg(&snap, ExportScope::All)).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert_eq!(parsed.system, snap.system);
    }

    #[test]
    fn reg_roundtrip_user_only() {
        let snap = fixture();
        let parsed = parse_reg(&to_reg(&snap, ExportScope::User)).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert!(parsed.system.is_empty());
    }

    #[test]
    fn reg_escape_backslash_roundtrip() {
        let snap = EnvSnapshot {
            user: [("X".to_string(), string("C:\\foo\\bar"))].into(),
            system: Default::default(),
        };
        let parsed = parse_reg(&to_reg(&snap, ExportScope::User)).unwrap();
        assert_eq!(parsed.user["X"].value, "C:\\foo\\bar");
    }

    #[test]
    fn reg_escape_quote_roundtrip() {
        let snap = EnvSnapshot {
            user: [("X".to_string(), string(r#"say "hello""#))].into(),
            system: Default::default(),
        };
        let parsed = parse_reg(&to_reg(&snap, ExportScope::User)).unwrap();
        assert_eq!(parsed.user["X"].value, r#"say "hello""#);
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
        assert_eq!(parsed.user["PATH"].value, "C:\\bin");
        assert!(!parsed.user.contains_key("DWORD_VAL"));
    }

    #[test]
    fn reg_parses_folded_expand_string() {
        let content = "Windows Registry Editor Version 5.00\r\n\
            \r\n[HKEY_CURRENT_USER\\Environment]\r\n\
            \"TEMP\"=hex(2):25,00,55,00,53,00,45,00,52,00,50,00,52,00,4f,00,46,00,49,00,\\\r\n\
              4c,00,45,00,25,00,5c,00,54,00,65,00,6d,00,70,00,00,00\r\n";
        let parsed = parse_reg(content).unwrap();
        assert_eq!(parsed.user["TEMP"].value, "%USERPROFILE%\\Temp");
        assert_eq!(parsed.user["TEMP"].kind, Some(EnvValueKind::ExpandString));
    }
}
