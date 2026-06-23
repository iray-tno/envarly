mod commands;
mod env_store;
mod error;
mod snapshot;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_env_vars,
            commands::get_registry_snapshot,
            commands::set_env_var,
            commands::delete_env_var,
            commands::create_snapshot,
            commands::list_snapshots,
            commands::delete_snapshot,
            commands::restore_snapshot,
            commands::validate_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running envarly");
}
