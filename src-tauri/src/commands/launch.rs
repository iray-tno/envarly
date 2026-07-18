use serde::Serialize;

use crate::error::EnvarlyError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchOptions {
    pub demo: bool,
    pub demo_fixture: Option<String>,
}

#[tauri::command]
pub fn get_launch_options() -> LaunchOptions {
    let mut args = std::env::args().skip(1);
    let mut demo = false;
    let mut demo_fixture = None;

    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--demo" => demo = true,
            "--demo-fixture" => {
                demo = true;
                demo_fixture = args.next();
            }
            _ if arg.starts_with("--demo-fixture=") => {
                demo = true;
                demo_fixture = Some(arg["--demo-fixture=".len()..].to_string());
            }
            _ => {}
        }
    }

    LaunchOptions { demo, demo_fixture }
}

#[tauri::command]
pub fn read_demo_fixture(path: String) -> Result<String, EnvarlyError> {
    std::fs::read_to_string(path).map_err(EnvarlyError::Registry)
}
