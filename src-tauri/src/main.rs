// Prevents an extra console window in release GUI builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Release builds use the "windows" subsystem and have no console by default.
    // When CLI args are present, attach to the parent terminal so stdout/stderr
    // are visible (e.g. `envarly --help`, `envarly list`).
    #[cfg(all(windows, not(debug_assertions)))]
    if std::env::args().len() > 1 {
        unsafe {
            windows_sys::Win32::System::Console::AttachConsole(
                windows_sys::Win32::System::Console::ATTACH_PARENT_PROCESS,
            );
        }
    }

    // If a CLI subcommand is present (e.g. `envarly get PATH`), handle it and exit.
    // With no args, this returns and the GUI launches below.
    #[cfg(windows)]
    envarly_lib::try_run_cli();
    #[cfg(windows)]
    envarly_lib::run();
}
