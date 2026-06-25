// Prevents an extra console window in release GUI builds.
// CLI subcommands work fine in debug builds or when launched from an existing terminal.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // If a CLI subcommand is present (e.g. `envarly get PATH`), handle it and exit.
    // With no args, this returns and the GUI launches below.
    #[cfg(windows)]
    envarly_lib::try_run_cli();
    #[cfg(windows)]
    envarly_lib::run();
}
