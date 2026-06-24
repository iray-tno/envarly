mod cli;
mod commands;
mod env_store;
mod error;
pub mod export;
mod snapshot;

/// If CLI subcommand args are present, execute them and exit the process.
/// Returns normally (unit) when there are no subcommand args, so the caller can launch the GUI.
pub fn try_run_cli() {
    if std::env::args().len() <= 1 {
        return;
    }
    cli::run() // -> !  (either exits 0 on success or exits 1 on error)
}

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
            commands::export_vars,
            commands::parse_import,
            commands::is_elevated,
            commands::restart_as_admin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running envarly");
}
