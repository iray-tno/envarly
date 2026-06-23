use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum EnvarlyError {
    #[error("Registry error: {0}")]
    Registry(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Snapshot error: {0}")]
    Snapshot(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

// Tauri commands must return serializable errors
impl Serialize for EnvarlyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
