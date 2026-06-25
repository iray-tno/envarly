fn main() {
    #[cfg(windows)]
    {
        println!("cargo:rerun-if-changed=icons/icon.ico");
        println!("cargo:rerun-if-changed=icons/icon.png");
        tauri_build::build()
    }
}
