//! Computes the diff (as `EnvChange`s) between the current registry state and
//! an imported `EnvSnapshot`, for `envarly import`. Backend-agnostic and pure
//! — no registry access here, so it's fully covered by unit tests alone.
//!
//! This mirrors the merge/replace semantics the GUI computes in the frontend
//! (`src/hooks/stagingLogic.ts` / `src/lib/diff.ts`), but is a separate,
//! CLI-only implementation: the CLI has no JS runtime to call into, and the
//! frontend logic is left untouched.

use std::collections::HashMap;

use crate::model::{EnvChange, EnvSnapshot, EnvValue, EnvValueKind, VarScope};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ImportStrategy {
    Merge,
    Replace,
}

/// `%[^%]+%` — mirrors `src/lib/envValueKind.ts`'s `inferEnvValueKind`, used
/// when an imported entry has no registry type (legacy export format).
///
/// Two consecutive `%` occurrences with more than 1 byte between them (i.e.
/// at least one non-`%` byte in between, since `%` is single-byte ASCII and
/// "consecutive" already rules out another `%` in that gap) is exactly a
/// `%[^%]+%` match — this avoids pulling in the `regex` crate for one
/// heuristic, and avoids manual byte-slicing (which would risk panicking on
/// a non-char-boundary index for non-ASCII values).
pub fn infer_env_value_kind(value: &str) -> EnvValueKind {
    let positions: Vec<usize> = value.match_indices('%').map(|(i, _)| i).collect();
    let has_reference = positions.windows(2).any(|w| w[1] > w[0] + 1);
    if has_reference {
        EnvValueKind::ExpandString
    } else {
        EnvValueKind::String
    }
}

fn resolve_kind(value: &EnvValue) -> EnvValueKind {
    value
        .kind
        .unwrap_or_else(|| infer_env_value_kind(&value.value))
}

fn scope_map(snapshot: &EnvSnapshot, scope: VarScope) -> Option<&HashMap<String, EnvValue>> {
    match scope {
        VarScope::User => Some(&snapshot.user),
        VarScope::System => Some(&snapshot.system),
        VarScope::OtherUser => snapshot.other_user.as_ref(),
    }
}

/// Diff `imported` against `current`, restricted to `scopes`. `current` is
/// the live registry snapshot; `imported` is what was parsed from the file.
pub fn diff_for_import(
    current: &EnvSnapshot,
    imported: &EnvSnapshot,
    scopes: &[VarScope],
    strategy: ImportStrategy,
) -> Vec<EnvChange> {
    let mut changes = Vec::new();

    for scope in scopes {
        let current_map = scope_map(current, scope.clone())
            .cloned()
            .unwrap_or_default();
        let imported_map = scope_map(imported, scope.clone())
            .cloned()
            .unwrap_or_default();

        for (name, value) in &imported_map {
            let value_kind = resolve_kind(value);
            let unchanged = current_map.get(name).is_some_and(|existing| {
                existing.value == value.value && resolve_kind(existing) == value_kind
            });
            if !unchanged {
                changes.push(EnvChange::Set {
                    name: name.clone(),
                    value: value.value.clone(),
                    value_kind,
                    scope: scope.clone(),
                });
            }
        }

        if strategy == ImportStrategy::Replace {
            for name in current_map.keys() {
                if !imported_map.contains_key(name) {
                    changes.push(EnvChange::Delete {
                        name: name.clone(),
                        scope: scope.clone(),
                    });
                }
            }
        }
    }

    changes
}

#[cfg(test)]
mod tests {
    use super::*;

    fn snap(user: &[(&str, &str)], system: &[(&str, &str)]) -> EnvSnapshot {
        EnvSnapshot {
            user: user
                .iter()
                .map(|(k, v)| {
                    (
                        k.to_string(),
                        EnvValue::typed(v.to_string(), EnvValueKind::String),
                    )
                })
                .collect(),
            system: system
                .iter()
                .map(|(k, v)| {
                    (
                        k.to_string(),
                        EnvValue::typed(v.to_string(), EnvValueKind::String),
                    )
                })
                .collect(),
            other_user: None,
        }
    }

    #[test]
    fn infers_expand_string_for_var_reference() {
        assert_eq!(
            infer_env_value_kind("%USERPROFILE%\\bin"),
            EnvValueKind::ExpandString
        );
        assert_eq!(
            infer_env_value_kind("C:\\Program Files"),
            EnvValueKind::String
        );
        assert_eq!(infer_env_value_kind("100%"), EnvValueKind::String); // lone %, no closing
        assert_eq!(infer_env_value_kind("%%"), EnvValueKind::String); // adjacent %s, empty middle
        assert_eq!(infer_env_value_kind("%%FOO%"), EnvValueKind::ExpandString); // valid pair after an empty one
    }

    #[test]
    fn merge_adds_new_and_updates_changed_leaves_extra_alone() {
        let current = snap(&[("KEEP_ME", "1"), ("CHANGE_ME", "old")], &[]);
        let imported = snap(&[("NEW_VAR", "v"), ("CHANGE_ME", "new")], &[]);

        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Merge,
        );

        assert_eq!(changes.len(), 2);
        assert!(changes.contains(&EnvChange::Set {
            name: "NEW_VAR".into(),
            value: "v".into(),
            value_kind: EnvValueKind::String,
            scope: VarScope::User,
        }));
        assert!(changes.contains(&EnvChange::Set {
            name: "CHANGE_ME".into(),
            value: "new".into(),
            value_kind: EnvValueKind::String,
            scope: VarScope::User,
        }));
        // KEEP_ME is untouched: no Set, no Delete.
        assert!(!changes.iter().any(|c| matches!(c, EnvChange::Set { name, .. } | EnvChange::Delete { name, .. } if name == "KEEP_ME")));
    }

    #[test]
    fn merge_with_no_differences_produces_no_changes() {
        let current = snap(&[("SAME", "1")], &[]);
        let imported = snap(&[("SAME", "1")], &[]);
        assert!(diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Merge
        )
        .is_empty());
    }

    #[test]
    fn replace_deletes_entries_missing_from_import() {
        let current = snap(&[("KEEP_ME", "1"), ("REMOVE_ME", "gone")], &[]);
        let imported = snap(&[("KEEP_ME", "1")], &[]);

        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Replace,
        );

        assert_eq!(
            changes,
            vec![EnvChange::Delete {
                name: "REMOVE_ME".into(),
                scope: VarScope::User
            }]
        );
    }

    #[test]
    fn scope_filter_ignores_other_scopes_in_both_snapshots() {
        let current = snap(&[("U", "1")], &[("S", "1")]);
        let imported = snap(&[("U", "2")], &[("S", "2")]);

        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Merge,
        );

        assert_eq!(changes.len(), 1);
        assert!(matches!(
            &changes[0],
            EnvChange::Set {
                scope: VarScope::User,
                ..
            }
        ));
    }

    #[test]
    fn legacy_entry_without_kind_falls_back_to_inference() {
        let current = EnvSnapshot {
            user: HashMap::new(),
            system: HashMap::new(),
            other_user: None,
        };
        let mut imported = EnvSnapshot {
            user: HashMap::new(),
            system: HashMap::new(),
            other_user: None,
        };
        imported.user.insert(
            "PATHLIKE".into(),
            EnvValue {
                value: "%USERPROFILE%\\bin".into(),
                kind: None,
            },
        );

        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Merge,
        );

        assert_eq!(
            changes,
            vec![EnvChange::Set {
                name: "PATHLIKE".into(),
                value: "%USERPROFILE%\\bin".into(),
                value_kind: EnvValueKind::ExpandString,
                scope: VarScope::User,
            }]
        );
    }

    // --- End-to-end: parse -> diff -> apply, against MemBackend only.
    // Zero real-registry interaction anywhere in this test.

    #[test]
    fn end_to_end_merge_applies_only_the_diff() {
        use crate::env_store::{apply_changes_with, read_snapshot_with, MemBackend};
        use crate::export::parse_json;

        let backend = MemBackend::new().with_user([("KEEP_ME", "1"), ("CHANGE_ME", "old")]);

        let file_contents = r#"{
            "version": 2,
            "user": {
                "CHANGE_ME": { "value": "new", "kind": "String" },
                "NEW_VAR": { "value": "v", "kind": "String" }
            }
        }"#;
        let imported = parse_json(file_contents).expect("valid fixture JSON");
        let current = read_snapshot_with(&backend).expect("read from MemBackend");
        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Merge,
        );

        apply_changes_with(&backend, &changes, |_, _, _, _| {}).expect("apply against MemBackend");

        let result = read_snapshot_with(&backend).expect("read back");
        assert_eq!(result.user.len(), 3);
        assert_eq!(result.user["KEEP_ME"].value, "1"); // untouched by merge
        assert_eq!(result.user["CHANGE_ME"].value, "new");
        assert_eq!(result.user["NEW_VAR"].value, "v");
    }

    #[test]
    fn end_to_end_replace_deletes_what_merge_would_have_kept() {
        use crate::env_store::{apply_changes_with, read_snapshot_with, MemBackend};
        use crate::export::parse_json;

        let backend = MemBackend::new().with_user([("KEEP_ME", "1"), ("REMOVE_ME", "gone")]);

        let file_contents =
            r#"{ "version": 2, "user": { "KEEP_ME": { "value": "1", "kind": "String" } } }"#;
        let imported = parse_json(file_contents).expect("valid fixture JSON");
        let current = read_snapshot_with(&backend).expect("read from MemBackend");
        let changes = diff_for_import(
            &current,
            &imported,
            &[VarScope::User],
            ImportStrategy::Replace,
        );

        apply_changes_with(&backend, &changes, |_, _, _, _| {}).expect("apply against MemBackend");

        let result = read_snapshot_with(&backend).expect("read back");
        assert_eq!(result.user.len(), 1);
        assert!(result.user.contains_key("KEEP_ME"));
        assert!(!result.user.contains_key("REMOVE_ME"));
    }
}
