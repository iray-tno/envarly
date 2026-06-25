use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use crate::crypto;
use crate::env_store::EnvSnapshot;
use crate::error::EnvarlyError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotMeta {
    pub id: String,
    pub created_at: String,
    pub label: String,
    pub snapshot: EnvSnapshot,
}

fn snapshots_dir() -> Result<PathBuf, EnvarlyError> {
    let dir = dirs_next::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Envarly")
        .join("snapshots");
    fs::create_dir_all(&dir)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot create snapshots dir: {e}")))?;
    Ok(dir)
}

fn write_snap(path: &PathBuf, meta: &SnapshotMeta) -> Result<(), EnvarlyError> {
    let json = serde_json::to_vec(meta)?;
    let encrypted = crypto::protect(&json)?;
    fs::write(path, encrypted)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot write snapshot: {e}")))?;
    Ok(())
}

fn read_snap(path: &PathBuf) -> Result<SnapshotMeta, EnvarlyError> {
    let encrypted = fs::read(path)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot read snapshot file: {e}")))?;
    let json = crypto::unprotect(&encrypted)?;
    serde_json::from_slice(&json)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot parse snapshot: {e}")))
}

pub fn save_snapshot(snapshot: EnvSnapshot, label: &str) -> Result<SnapshotMeta, EnvarlyError> {
    let now = Utc::now();
    let id = now.format("%Y%m%dT%H%M%SZ").to_string();
    let meta = SnapshotMeta {
        id: id.clone(),
        created_at: now.to_rfc3339(),
        label: label.to_string(),
        snapshot,
    };
    let path = snapshots_dir()?.join(format!("{id}.snap"));
    write_snap(&path, &meta)?;
    Ok(meta)
}

#[cfg(test)]
pub fn save_snapshot_to(
    snapshot: EnvSnapshot,
    label: &str,
    dir: &PathBuf,
) -> Result<SnapshotMeta, EnvarlyError> {
    let now = Utc::now();
    let id = now.format("%Y%m%dT%H%M%SZ").to_string();
    let meta = SnapshotMeta {
        id: id.clone(),
        created_at: now.to_rfc3339(),
        label: label.to_string(),
        snapshot,
    };
    fs::create_dir_all(dir)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot create dir: {e}")))?;
    let path = dir.join(format!("{id}.snap"));
    write_snap(&path, &meta)?;
    Ok(meta)
}

pub fn list_snapshots() -> Result<Vec<SnapshotMeta>, EnvarlyError> {
    list_snapshots_from(&snapshots_dir()?)
}

pub fn list_snapshots_from(dir: &PathBuf) -> Result<Vec<SnapshotMeta>, EnvarlyError> {
    let mut metas: Vec<SnapshotMeta> = Vec::new();
    for entry in fs::read_dir(dir)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot read snapshots dir: {e}")))?
    {
        let entry =
            entry.map_err(|e| EnvarlyError::Snapshot(format!("Read entry error: {e}")))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("snap") {
            continue;
        }
        if let Ok(meta) = read_snap(&path) {
            metas.push(meta);
        }
    }
    metas.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(metas)
}

pub fn delete_snapshot(id: &str) -> Result<(), EnvarlyError> {
    let path = snapshots_dir()?.join(format!("{id}.snap"));
    fs::remove_file(&path)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot delete snapshot: {e}")))?;
    Ok(())
}

#[cfg(test)]
pub fn delete_snapshot_from(id: &str, dir: &PathBuf) -> Result<(), EnvarlyError> {
    let path = dir.join(format!("{id}.snap"));
    fs::remove_file(&path)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot delete snapshot: {e}")))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn make_snapshot() -> EnvSnapshot {
        EnvSnapshot {
            user: HashMap::from([("MY_VAR".to_string(), "hello".to_string())]),
            system: HashMap::new(),
        }
    }

    #[test]
    fn save_and_list_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().to_path_buf();

        let saved = save_snapshot_to(make_snapshot(), "test label", &path).unwrap();
        assert_eq!(saved.label, "test label");
        assert!(!saved.id.is_empty());

        let list = list_snapshots_from(&path).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, saved.id);
        assert_eq!(list[0].label, "test label");
        assert_eq!(list[0].snapshot.user.get("MY_VAR").map(|s| s.as_str()), Some("hello"));
    }

    #[test]
    fn list_empty_dir() {
        let dir = tempfile::tempdir().unwrap();
        let list = list_snapshots_from(&dir.path().to_path_buf()).unwrap();
        assert!(list.is_empty());
    }

    #[test]
    fn delete_snapshot_removes_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().to_path_buf();

        let saved = save_snapshot_to(make_snapshot(), "to delete", &path).unwrap();
        let before = list_snapshots_from(&path).unwrap();
        assert_eq!(before.len(), 1);

        delete_snapshot_from(&saved.id, &path).unwrap();
        let after = list_snapshots_from(&path).unwrap();
        assert!(after.is_empty());
    }

    #[test]
    fn list_sorted_newest_first() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().to_path_buf();

        save_snapshot_to(make_snapshot(), "first", &path).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(1));
        save_snapshot_to(make_snapshot(), "second", &path).unwrap();

        let list = list_snapshots_from(&path).unwrap();
        assert_eq!(list[0].label, "second");
        assert_eq!(list[1].label, "first");
    }

    #[test]
    fn delete_nonexistent_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let result = delete_snapshot_from("no-such-id", &dir.path().to_path_buf());
        assert!(result.is_err());
    }
}
