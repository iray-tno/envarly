// Build as a console subsystem app so the shell waits for the process when CLI
// args are present. For GUI-only launches (no args), we hide the console window
// immediately so users never see a flash.

fn main() {
    #[cfg(windows)]
    if std::env::args().len() <= 1 {
        // GUI mode: detach from the console Windows allocated so its window
        // closes without a minimize/hide animation, then restore focus to
        // whatever was active before our console stole it.
        unsafe {
            let prev = windows_sys::Win32::UI::WindowsAndMessaging::GetForegroundWindow();
            windows_sys::Win32::System::Console::FreeConsole();
            if !prev.is_null() {
                windows_sys::Win32::UI::WindowsAndMessaging::SetForegroundWindow(prev);
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
