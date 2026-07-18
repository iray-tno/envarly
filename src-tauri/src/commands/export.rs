use serde::Deserialize;
use std::collections::HashMap;

use crate::env_store::{self, EnvSnapshot, EnvValue, EnvValueKind};
use crate::error::EnvarlyError;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomExportVar {
    pub name: String,
    pub value: String,
    pub value_kind: EnvValueKind,
    pub scope: String,
}

/// Open a native save dialog and write the exported content to the chosen file.
/// Returns the saved file path, or None if the user cancelled.
#[tauri::command]
pub async fn export_vars(
    app: tauri::AppHandle,
    scope: String,
    format: String,
) -> Result<Option<String>, EnvarlyError> {
    use crate::export::ExportScope;
    use tauri_plugin_dialog::{DialogExt, FilePath};

    let export_scope = ExportScope::try_from(scope.as_str())?;
    let snapshot = env_store::read_snapshot()?;
    let spec = crate::export::resolve_export(&snapshot, &format, export_scope, "envarly");

    let default_name = format!(
        "{}-{}.{}",
        spec.file_stem,
        chrono::Local::now().format("%Y%m%d"),
        spec.ext
    );

    let path = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(spec.filter_name, &[spec.ext])
        .blocking_save_file();

    match path {
        Some(FilePath::Path(p)) => {
            std::fs::write(&p, spec.content.as_bytes()).map_err(EnvarlyError::Registry)?;
            Ok(Some(p.to_string_lossy().into_owned()))
        }
        _ => Ok(None),
    }
}

/// Parse an exported file and return its contents as a snapshot. Does NOT touch the registry.
#[tauri::command]
pub fn parse_import(content: String, format: String) -> Result<EnvSnapshot, EnvarlyError> {
    match format.as_str() {
        "reg" => crate::export::parse_reg(&content),
        _ => crate::export::parse_json(&content),
    }
}

/// Export a caller-supplied list of variables (name+value+scope) to a user-chosen file.
/// Values come from the frontend so no extra registry read is needed.
#[tauri::command]
pub async fn export_custom(
    app: tauri::AppHandle,
    vars: Vec<CustomExportVar>,
    format: String,
) -> Result<Option<String>, EnvarlyError> {
    use crate::export::ExportScope;
    use tauri_plugin_dialog::{DialogExt, FilePath};

    let mut snapshot = EnvSnapshot {
        user: HashMap::new(),
        system: HashMap::new(),
    };
    for v in &vars {
        match v.scope.as_str() {
            "User" => {
                snapshot.user.insert(
                    v.name.clone(),
                    EnvValue::typed(v.value.clone(), v.value_kind),
                );
            }
            "System" => {
                snapshot.system.insert(
                    v.name.clone(),
                    EnvValue::typed(v.value.clone(), v.value_kind),
                );
            }
            other => {
                return Err(EnvarlyError::InvalidInput(format!(
                    "invalid scope: {other:?}"
                )))
            }
        }
    }

    let spec =
        crate::export::resolve_export(&snapshot, &format, ExportScope::All, "envarly-custom");

    let default_name = format!(
        "{}-{}.{}",
        spec.file_stem,
        chrono::Local::now().format("%Y%m%d"),
        spec.ext
    );

    let path = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter(spec.filter_name, &[spec.ext])
        .blocking_save_file();

    match path {
        Some(FilePath::Path(p)) => {
            std::fs::write(&p, spec.content.as_bytes()).map_err(EnvarlyError::Registry)?;
            Ok(Some(p.to_string_lossy().into_owned()))
        }
        _ => Ok(None),
    }
}
