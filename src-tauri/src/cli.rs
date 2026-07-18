/// Read-only CLI commands. No subcommand → the caller launches the GUI instead.
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Parser)]
#[command(
    name = "envarly",
    about = "Windows environment variable manager",
    version
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Print the value of an environment variable (read-only)
    Get {
        /// Variable name (case-insensitive)
        name: String,
        #[arg(long, value_enum, default_value_t = ScopeArg::All)]
        scope: ScopeArg,
    },
    /// List environment variables (read-only)
    List {
        #[arg(long, value_enum, default_value_t = ScopeArg::All)]
        scope: ScopeArg,
        #[arg(long, value_enum, default_value_t = ListFormat::Text)]
        format: ListFormat,
    },
    /// Export environment variables to a file or stdout (read-only)
    Export {
        #[arg(long, value_enum, default_value_t = ScopeArg::All)]
        scope: ScopeArg,
        #[arg(long, value_enum, default_value_t = ExportFormat::Json)]
        format: ExportFormat,
        /// Write to this file instead of stdout
        #[arg(short, long)]
        output: Option<std::path::PathBuf>,
    },
    /// Internal: remove Envarly install directory from PATH. Called by the uninstaller.
    #[command(name = "path-cleanup", hide = true)]
    PathCleanup {
        /// Print what would change without modifying the registry.
        #[arg(long)]
        dry_run: bool,
    },
}

#[derive(Clone, ValueEnum, Default)]
enum ScopeArg {
    #[default]
    All,
    User,
    System,
}

#[derive(Clone, ValueEnum, Default)]
enum ListFormat {
    #[default]
    Text,
    Json,
}

#[derive(Clone, ValueEnum, Default)]
enum ExportFormat {
    #[default]
    Json,
    Reg,
    Ps1,
    DscV2,
    DscV3,
    Ansible,
}

/// Parse CLI args and execute the subcommand. Never returns — exits the process.
/// Only called when args.len() > 1.
pub fn run() -> ! {
    let cli = Cli::parse(); // prints help / version and exits on parse error

    if let Err(e) = execute(cli.command) {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
    std::process::exit(0);
}

fn execute(command: Command) -> Result<(), crate::error::EnvarlyError> {
    use crate::env_store;
    use crate::export;
    use crate::model::VarScope;

    match command {
        Command::Get { name, scope } => {
            let vars = env_store::read_all()?;
            let found: Vec<_> = vars
                .iter()
                .filter(|v| {
                    v.name.eq_ignore_ascii_case(&name)
                        && match scope {
                            ScopeArg::User => matches!(v.scope, VarScope::User),
                            ScopeArg::System => matches!(v.scope, VarScope::System),
                            ScopeArg::All => true,
                        }
                })
                .collect();

            if found.is_empty() {
                eprintln!("Variable '{}' not found", name);
                std::process::exit(1);
            }
            for v in found {
                println!("{}", v.value);
            }
        }

        Command::List { scope, format } => {
            let vars = env_store::read_all()?;
            let filtered: Vec<_> = vars
                .iter()
                .filter(|v| match scope {
                    ScopeArg::User => matches!(v.scope, VarScope::User),
                    ScopeArg::System => matches!(v.scope, VarScope::System),
                    ScopeArg::All => true,
                })
                .collect();

            match format {
                ListFormat::Json => {
                    println!("{}", serde_json::to_string_pretty(&filtered)?);
                }
                ListFormat::Text => {
                    for v in &filtered {
                        let tag = match v.scope {
                            VarScope::User => "user",
                            VarScope::System => "sys ",
                        };
                        println!("[{}] {}={}", tag, v.name, v.value);
                    }
                }
            }
        }

        Command::PathCleanup { dry_run } => {
            crate::path_manage::cleanup_path(dry_run);
        }

        Command::Export {
            scope,
            format,
            output,
        } => {
            let snapshot = env_store::read_snapshot()?;
            let export_scope = match scope {
                ScopeArg::User => export::ExportScope::User,
                ScopeArg::System => export::ExportScope::System,
                ScopeArg::All => export::ExportScope::All,
            };
            let content = match format {
                ExportFormat::Json => export::to_json(&snapshot, export_scope),
                ExportFormat::Reg => export::to_reg(&snapshot, export_scope),
                ExportFormat::Ps1 => export::to_ps1(&snapshot, export_scope),
                ExportFormat::DscV2 => export::to_dsc_v2(&snapshot, export_scope),
                ExportFormat::DscV3 => export::to_dsc_v3(&snapshot, export_scope),
                ExportFormat::Ansible => export::to_ansible(&snapshot, export_scope),
            };
            match output {
                Some(path) => std::fs::write(&path, content.as_bytes())
                    .map_err(crate::error::EnvarlyError::Registry)?,
                None => print!("{}", content),
            }
        }
    }

    Ok(())
}
