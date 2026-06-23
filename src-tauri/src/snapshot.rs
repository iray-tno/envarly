use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

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

pub fn save_snapshot(snapshot: EnvSnapshot, label: &str) -> Result<SnapshotMeta, EnvarlyError> {
    let now = Utc::now();
    let id = now.format("%Y%m%dT%H%M%SZ").to_string();
    let meta = SnapshotMeta {
        id: id.clone(),
        created_at: now.to_rfc3339(),
        label: label.to_string(),
        snapshot,
    };
    let dir = snapshots_dir()?;
    let path = dir.join(format!("{id}.json"));
    let json = serde_json::to_string_pretty(&meta)?;
    fs::write(&path, json)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot write snapshot: {e}")))?;
    Ok(meta)
}

pub fn list_snapshots() -> Result<Vec<SnapshotMeta>, EnvarlyError> {
    let dir = snapshots_dir()?;
    let mut metas: Vec<SnapshotMeta> = Vec::new();
    for entry in fs::read_dir(&dir)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot read snapshots dir: {e}")))?
    {
        let entry = entry
            .map_err(|e| EnvarlyError::Snapshot(format!("Read entry error: {e}")))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let data = fs::read_to_string(&path)
            .map_err(|e| EnvarlyError::Snapshot(format!("Cannot read snapshot file: {e}")))?;
        if let Ok(meta) = serde_json::from_str::<SnapshotMeta>(&data) {
            metas.push(meta);
        }
    }
    metas.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(metas)
}

pub fn delete_snapshot(id: &str) -> Result<(), EnvarlyError> {
    let dir = snapshots_dir()?;
    let path = dir.join(format!("{id}.json"));
    fs::remove_file(&path)
        .map_err(|e| EnvarlyError::Snapshot(format!("Cannot delete snapshot: {e}")))?;
    Ok(())
}
