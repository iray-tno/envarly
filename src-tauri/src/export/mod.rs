use crate::env_store::{EnvSnapshot, EnvValueKind};
use crate::error::EnvarlyError;

mod ansible;
mod dsc;
mod json;
mod powershell;
mod reg;

pub use ansible::to_ansible;
pub use dsc::{to_dsc_v2, to_dsc_v3};
pub use json::{parse_json, to_json};
pub use powershell::to_ps1;
pub use reg::{parse_reg, to_reg};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportScope {
    User,
    System,
    All,
}

impl ExportScope {
    pub fn includes_user(self) -> bool {
        matches!(self, ExportScope::User | ExportScope::All)
    }
    pub fn includes_system(self) -> bool {
        matches!(self, ExportScope::System | ExportScope::All)
    }
}

impl TryFrom<&str> for ExportScope {
    type Error = EnvarlyError;
    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s {
            "User" => Ok(ExportScope::User),
            "System" => Ok(ExportScope::System),
            "All" => Ok(ExportScope::All),
            other => Err(EnvarlyError::InvalidInput(format!(
                "invalid scope: {other:?}"
            ))),
        }
    }
}

pub struct FormatSpec {
    pub content: String,
    pub ext: &'static str,
    pub file_stem: String,
    pub filter_name: &'static str,
}

/// Resolve format string and scope to a ready-to-save export. `stem_prefix` is prepended
/// to the format-specific filename suffix (e.g. "envarly" or "envarly-custom").
pub fn resolve_export(
    snapshot: &EnvSnapshot,
    format: &str,
    scope: ExportScope,
    stem_prefix: &str,
) -> FormatSpec {
    let (content, ext, stem_suffix, filter_name) = match format {
        "reg" => (to_reg(snapshot, scope), "reg", "", "Registry files"),
        "ps1" => (to_ps1(snapshot, scope), "ps1", "", "PowerShell Script"),
        "dsc_v2" => (
            to_dsc_v2(snapshot, scope),
            "ps1",
            "-dsc",
            "PowerShell DSC Configuration",
        ),
        "dsc_v3" => (
            to_dsc_v3(snapshot, scope),
            "dsc.yaml",
            "-dsc3",
            "DSC v3 Configuration",
        ),
        "ansible" => (
            to_ansible(snapshot, scope),
            "yml",
            "-ansible",
            "Ansible Playbook",
        ),
        _ => (to_json(snapshot, scope), "json", "", "JSON files"),
    };
    FormatSpec {
        content,
        ext,
        file_stem: format!("{stem_prefix}{stem_suffix}"),
        filter_name,
    }
}

/// Single-quote a string for PowerShell. Single quotes prevent variable expansion.
/// Internal single quotes are escaped by doubling: ' → ''
fn ps1_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "''"))
}

/// Double-quote a string for YAML. Escapes backslashes, double quotes, and control chars.
fn yaml_quote(s: &str) -> String {
    let escaped = s
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t");
    format!("\"{}\"", escaped)
}

fn type_limitation_notice(snapshot: &EnvSnapshot, scope: ExportScope, prefix: &str) -> String {
    let includes_expandable = (scope.includes_user()
        && snapshot
            .user
            .values()
            .any(|value| value.kind == Some(EnvValueKind::ExpandString)))
        || (scope.includes_system()
            && snapshot
                .system
                .values()
                .any(|value| value.kind == Some(EnvValueKind::ExpandString)));
    if includes_expandable {
        format!(
            "{prefix}Warning: this format cannot preserve REG_EXPAND_SZ separately from REG_SZ.\n"
        )
    } else {
        String::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ps1_quote_simple() {
        assert_eq!(ps1_quote("hello"), "'hello'");
    }

    #[test]
    fn ps1_quote_with_single_quote() {
        assert_eq!(ps1_quote("it's"), "'it''s'");
    }

    #[test]
    fn ps1_quote_backslash_unchanged() {
        // Backslashes don't need escaping in single-quoted PS strings
        assert_eq!(ps1_quote("C:\\foo"), "'C:\\foo'");
    }

    #[test]
    fn yaml_quote_simple() {
        assert_eq!(yaml_quote("hello"), "\"hello\"");
    }

    #[test]
    fn yaml_quote_backslash() {
        assert_eq!(yaml_quote("C:\\foo"), "\"C:\\\\foo\"");
    }

    #[test]
    fn yaml_quote_double_quote() {
        assert_eq!(yaml_quote(r#"say "hi""#), r#""say \"hi\"""#);
    }
}
