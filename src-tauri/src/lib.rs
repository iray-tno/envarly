#[cfg(windows)]
mod cli;
#[cfg(windows)]
mod commands;
#[cfg(windows)]
mod crypto;
#[cfg(windows)]
mod env_backend;
mod env_store;
mod error;
pub mod export;
#[cfg(windows)]
mod path_backend;
mod path_manage;
#[cfg(windows)]
mod snapshot;

/// If CLI subcommand args are present, execute them and exit the process.
/// Returns normally (unit) when there are no subcommand args, so the caller can launch the GUI.
#[cfg(windows)]
pub fn try_run_cli() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty()
        || args
            .iter()
            .any(|arg| arg == "--demo" || arg.starts_with("--demo-fixture"))
    {
        return;
    }
    cli::run() // -> !  (either exits 0 on success or exits 1 on error)
}

#[cfg(windows)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::env::get_env_vars,
            commands::env::get_unsupported_env_values,
            commands::env::get_registry_snapshot,
            commands::env::set_env_var,
            commands::env::delete_env_var,
            commands::env::apply_env_changes,
            commands::snapshot::create_snapshot,
            commands::snapshot::list_snapshots,
            commands::snapshot::rename_snapshot,
            commands::snapshot::delete_snapshot,
            commands::path::validate_paths,
            commands::export::export_vars,
            commands::export::export_custom,
            commands::export::parse_import,
            commands::env::is_elevated,
            commands::env::restart_as_admin,
            commands::path::get_path_status,
            commands::path::get_path_proposal,
            commands::launch::get_launch_options,
            commands::launch::read_demo_fixture,
        ])
        .run(tauri::generate_context!())
        .expect("error while running envarly");
}
