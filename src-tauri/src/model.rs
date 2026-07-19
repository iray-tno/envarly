//! Shared domain types for environment variables, snapshots, and staged changes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum VarScope {
    User,
    System,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum EnvValueKind {
    String,
    ExpandString,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvValue {
    pub value: String,
    /// Legacy snapshots have no registry type. They remain readable, but the
    /// frontend must resolve the type before staging a restore.
    pub kind: Option<EnvValueKind>,
}

impl EnvValue {
    pub fn typed(value: String, kind: EnvValueKind) -> Self {
        Self {
            value,
            kind: Some(kind),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvVar {
    pub name: String,
    pub value: String,
    pub scope: VarScope,
    pub value_kind: EnvValueKind,
    /// ";", ",", or null — indicates how the value should be rendered as a list.
    pub list_separator: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvSnapshot {
    pub user: HashMap<String, EnvValue>,
    pub system: HashMap<String, EnvValue>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UnsupportedEnvValue {
    pub name: String,
    pub scope: VarScope,
    pub registry_type: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(
    tag = "changeType",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum EnvChange {
    Set {
        name: String,
        value: String,
        value_kind: EnvValueKind,
        scope: VarScope,
    },
    Delete {
        name: String,
        scope: VarScope,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn env_change_deserializes_camel_case_fields() {
        let change: EnvChange = serde_json::from_value(serde_json::json!({
            "changeType": "set",
            "name": "EXPANDED",
            "value": "%USERPROFILE%\\tools",
            "valueKind": "ExpandString",
            "scope": "User"
        }))
        .unwrap();

        assert_eq!(
            change,
            EnvChange::Set {
                name: "EXPANDED".into(),
                value: "%USERPROFILE%\\tools".into(),
                value_kind: EnvValueKind::ExpandString,
                scope: VarScope::User,
            }
        );
    }
}
