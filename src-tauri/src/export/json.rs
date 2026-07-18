use std::collections::HashMap;

use super::ExportScope;
use crate::env_store::{EnvSnapshot, EnvValue};
use crate::error::EnvarlyError;

/// Export snapshot as pretty-printed JSON.
pub fn to_json(snapshot: &EnvSnapshot, scope: ExportScope) -> String {
    let mut obj = serde_json::Map::new();
    obj.insert("version".into(), serde_json::Value::from(2));
    if scope.includes_user() {
        obj.insert(
            "user".into(),
            serde_json::to_value(&snapshot.user).unwrap_or_default(),
        );
    }
    if scope.includes_system() {
        obj.insert(
            "system".into(),
            serde_json::to_value(&snapshot.system).unwrap_or_default(),
        );
    }
    serde_json::to_string_pretty(&serde_json::Value::Object(obj)).unwrap_or_default()
}

/// Parse JSON export back into a snapshot. Does NOT write to the registry.
pub fn parse_json(content: &str) -> Result<EnvSnapshot, EnvarlyError> {
    let v: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| EnvarlyError::InvalidInput(format!("JSON parse error: {e}")))?;

    let as_map = |key: &str| -> HashMap<String, EnvValue> {
        v.get(key)
            .and_then(|o| o.as_object())
            .map(|m| {
                m.iter()
                    .filter_map(|(k, vv)| {
                        if let Some(value) = vv.as_str() {
                            return Some((
                                k.clone(),
                                EnvValue {
                                    value: value.to_owned(),
                                    kind: None,
                                },
                            ));
                        }
                        serde_json::from_value(vv.clone())
                            .ok()
                            .map(|value| (k.clone(), value))
                    })
                    .collect()
            })
            .unwrap_or_default()
    };

    Ok(EnvSnapshot {
        user: as_map("user"),
        system: as_map("system"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::env_store::EnvValueKind;

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
    fn json_roundtrip_all() {
        let snap = fixture();
        let json = to_json(&snap, ExportScope::All);
        assert!(json.contains("\"version\": 2"));
        let parsed = parse_json(&json).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert_eq!(parsed.system, snap.system);
    }

    #[test]
    fn json_roundtrip_user_only() {
        let snap = fixture();
        let parsed = parse_json(&to_json(&snap, ExportScope::User)).unwrap();
        assert_eq!(parsed.user, snap.user);
        assert!(parsed.system.is_empty());
    }

    #[test]
    fn json_roundtrip_system_only() {
        let snap = fixture();
        let parsed = parse_json(&to_json(&snap, ExportScope::System)).unwrap();
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

    #[test]
    fn json_legacy_values_remain_unresolved() {
        let parsed = parse_json(r#"{"user":{"TEMP":"%USERPROFILE%\\Temp"}}"#).unwrap();
        assert_eq!(parsed.user["TEMP"].value, "%USERPROFILE%\\Temp");
        assert_eq!(parsed.user["TEMP"].kind, None);
    }
}
