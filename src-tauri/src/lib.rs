#[cfg(windows)]
mod cli;
#[cfg(windows)]
mod commands;
#[cfg(windows)]
mod crypto;
mod env_store;
mod error;
pub mod export;
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
            commands::get_env_vars,
            commands::get_unsupported_env_values,
            commands::get_registry_snapshot,
            commands::set_env_var,
            commands::delete_env_var,
            commands::apply_env_changes,
            commands::create_snapshot,
            commands::list_snapshots,
            commands::delete_snapshot,
            commands::validate_paths,
            commands::export_vars,
            commands::export_custom,
            commands::parse_import,
            commands::is_elevated,
            commands::restart_as_admin,
            commands::get_path_status,
            commands::get_path_proposal,
            commands::get_launch_options,
            commands::read_demo_fixture,
        ])
        .run(tauri::generate_context!())
        .expect("error while running envarly");
}
