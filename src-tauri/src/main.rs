// Build as a console subsystem app so the shell waits for the process when CLI
// args are present. For GUI-only launches (no args), we hide the console window
// immediately so users never see a flash.

fn main() {
    #[cfg(windows)]
    if std::env::args().len() <= 1 {
        // GUI mode: hide the console window that Windows allocated for us, then
        // detach from it so it doesn't linger.
        unsafe {
            let hwnd = windows_sys::Win32::System::Console::GetConsoleWindow();
            if !hwnd.is_null() {
                windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(hwnd, 0); // SW_HIDE
                windows_sys::Win32::System::Console::FreeConsole();
            }
        }
    }

    // If a CLI subcommand is present (e.g. `envarly --help`, `envarly list`),
    // handle it and exit. The console subsystem ensures the shell waits for us.
    #[cfg(windows)]
    envarly_lib::try_run_cli();
    #[cfg(windows)]
    envarly_lib::run();
}
