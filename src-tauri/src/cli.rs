//! CLI subcommands. No subcommand → the caller launches the GUI instead.
//!
//! `get`/`list`/`export` are read-only. `import`/`set`/`delete` can write to
//! the registry, but are dry-run by default and only do so when `--apply` is
//! passed.

use crate::model::{EnvChange, EnvSnapshot, VarScope};
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
    /// Import environment variables from a previously exported file. Dry-run
    /// by default — nothing is written to the registry unless --apply is
    /// passed.
    Import {
        /// Path to a previously exported .json or .reg file
        file: std::path::PathBuf,
        #[arg(long, value_enum, default_value_t = ImportFormat::Json)]
        format: ImportFormat,
        #[arg(long, value_enum, default_value_t = ScopeArg::All)]
        scope: ScopeArg,
        #[arg(long, value_enum, default_value_t = StrategyArg::Merge)]
        strategy: StrategyArg,
        /// Actually write the changes to the registry. Without this flag,
        /// only prints what would change.
        #[arg(long)]
        apply: bool,
    },
    /// Set a single environment variable. Dry-run by default — nothing is
    /// written unless --apply is passed.
    Set {
        /// Variable name (matched case-sensitively against the registry, like `import`)
        name: String,
        /// New value
        value: String,
        #[arg(long, value_enum, default_value_t = WriteScopeArg::User)]
        scope: WriteScopeArg,
        #[arg(long, value_enum, default_value_t = KindArg::Auto)]
        kind: KindArg,
        /// Actually write the change to the registry. Without this flag,
        /// only prints what would change.
        #[arg(long)]
        apply: bool,
    },
    /// Delete a single environment variable. Dry-run by default — nothing is
    /// written unless --apply is passed.
    Delete {
        /// Variable name (matched case-sensitively against the registry, like `import`)
        name: String,
        #[arg(long, value_enum, default_value_t = WriteScopeArg::User)]
        scope: WriteScopeArg,
        /// Actually write the change to the registry. Without this flag,
        /// only prints what would change.
        #[arg(long)]
        apply: bool,
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

#[derive(Clone, ValueEnum, Default)]
enum ImportFormat {
    #[default]
    Json,
    Reg,
}

#[derive(Clone, ValueEnum, Default)]
enum StrategyArg {
    #[default]
    Merge,
    Replace,
}

/// Scope for a single-variable write. No `All` — a write always targets one scope.
#[derive(Clone, ValueEnum, Default)]
enum WriteScopeArg {
    #[default]
    User,
    System,
}

#[derive(Clone, Copy, ValueEnum, Default)]
enum KindArg {
    #[default]
    Auto,
    String,
    ExpandString,
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
                            VarScope::OtherUser => "other",
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

        Command::Import {
            file,
            format,
            scope,
            strategy,
            apply,
        } => {
            use crate::import::{diff_for_import, ImportStrategy};

            let content =
                std::fs::read_to_string(&file).map_err(crate::error::EnvarlyError::Registry)?;
            let imported = match format {
                ImportFormat::Json => export::parse_json(&content)?,
                ImportFormat::Reg => export::parse_reg(&content)?,
            };
            let current = env_store::read_snapshot()?;
            let scopes: Vec<VarScope> = match scope {
                ScopeArg::All => vec![VarScope::User, VarScope::System],
                ScopeArg::User => vec![VarScope::User],
                ScopeArg::System => vec![VarScope::System],
            };
            let import_strategy = match strategy {
                StrategyArg::Merge => ImportStrategy::Merge,
                StrategyArg::Replace => ImportStrategy::Replace,
            };
            let changes = diff_for_import(&current, &imported, &scopes, import_strategy);

            if changes.is_empty() {
                println!("Already up to date — nothing to change.");
                return Ok(());
            }

            let strategy_label = match strategy {
                StrategyArg::Merge => "merge",
                StrategyArg::Replace => "replace",
            };
            let scope_label = match scope {
                ScopeArg::All => "All",
                ScopeArg::User => "User",
                ScopeArg::System => "System",
            };
            println!(
                "{} {} change{} ({}, scope: {}):",
                if apply { "Applying" } else { "Would apply" },
                changes.len(),
                if changes.len() == 1 { "" } else { "s" },
                strategy_label,
                scope_label,
            );
            for change in &changes {
                match change {
                    EnvChange::Set {
                        name, value, scope, ..
                    } => match current_value(&current, scope, name) {
                        Some(old) if old != value => {
                            println!(
                                "  ~ {}={} (was {})  [{}]",
                                name,
                                value,
                                old,
                                scope_tag(scope)
                            )
                        }
                        Some(_) => println!("  ~ {}={}  [{}]", name, value, scope_tag(scope)),
                        None => println!("  + {}={}  [{}]", name, value, scope_tag(scope)),
                    },
                    EnvChange::Delete { name, scope } => {
                        println!("  - {}  [{}]", name, scope_tag(scope))
                    }
                }
            }

            write_changes(&changes, apply)?;
        }

        Command::Set {
            name,
            value,
            scope,
            kind,
            apply,
        } => {
            let write_scope = match scope {
                WriteScopeArg::User => VarScope::User,
                WriteScopeArg::System => VarScope::System,
            };
            let current = env_store::read_snapshot()?;
            let existing = current_entry(&current, &write_scope, &name);
            let value_kind = crate::import::resolve_set_kind(explicit_kind(kind), &value, existing);

            let unchanged = existing
                .is_some_and(|e| e.value == value && crate::import::resolve_kind(e) == value_kind);
            if unchanged {
                println!("Already up to date — nothing to change.");
                return Ok(());
            }

            match existing {
                Some(e) if e.value != value => println!(
                    "  ~ {}={} (was {})  [{}]",
                    name,
                    value,
                    e.value,
                    scope_tag(&write_scope)
                ),
                Some(_) => println!("  ~ {}={}  [{}]", name, value, scope_tag(&write_scope)),
                None => println!("  + {}={}  [{}]", name, value, scope_tag(&write_scope)),
            }
            print_critical_warning(&write_scope, &name);

            let changes = vec![EnvChange::Set {
                name,
                value,
                value_kind,
                scope: write_scope,
            }];
            write_changes(&changes, apply)?;
        }

        Command::Delete { name, scope, apply } => {
            let write_scope = match scope {
                WriteScopeArg::User => VarScope::User,
                WriteScopeArg::System => VarScope::System,
            };
            let current = env_store::read_snapshot()?;
            if current_entry(&current, &write_scope, &name).is_none() {
                eprintln!(
                    "Variable '{}' not found in {} scope",
                    name,
                    scope_tag(&write_scope)
                );
                std::process::exit(1);
            }

            println!("  - {}  [{}]", name, scope_tag(&write_scope));
            print_critical_warning(&write_scope, &name);

            let changes = vec![EnvChange::Delete {
                name,
                scope: write_scope,
            }];
            write_changes(&changes, apply)?;
        }
    }

    Ok(())
}

fn write_changes(changes: &[EnvChange], apply: bool) -> Result<(), crate::error::EnvarlyError> {
    if !apply {
        println!("\nRun with --apply to write these changes to the registry.");
        return Ok(());
    }

    println!();
    let result = crate::env_store::apply_changes(changes, |index, total, change, result| {
        let name = match change {
            EnvChange::Set { name, .. } | EnvChange::Delete { name, .. } => name,
        };
        match result {
            Ok(()) => println!("  [{}/{}] ok {}", index + 1, total, name),
            Err(e) => println!("  [{}/{}] FAILED {} ({})", index + 1, total, name, e),
        }
    });

    match result {
        Ok(()) => {
            println!(
                "\nApplied {} change{}.",
                changes.len(),
                if changes.len() == 1 { "" } else { "s" }
            );
            Ok(())
        }
        Err(e) => {
            eprintln!("\nApply failed, rolled back: {}", e);
            std::process::exit(1);
        }
    }
}

fn current_value<'a>(current: &'a EnvSnapshot, scope: &VarScope, name: &str) -> Option<&'a str> {
    let map = match scope {
        VarScope::User => &current.user,
        VarScope::System => &current.system,
        VarScope::OtherUser => return None,
    };
    map.get(name).map(|v| v.value.as_str())
}

fn scope_tag(scope: &VarScope) -> &'static str {
    match scope {
        VarScope::User => "User",
        VarScope::System => "System",
        VarScope::OtherUser => "OtherUser",
    }
}

fn current_entry<'a>(
    current: &'a EnvSnapshot,
    scope: &VarScope,
    name: &str,
) -> Option<&'a crate::model::EnvValue> {
    let map = match scope {
        VarScope::User => &current.user,
        VarScope::System => &current.system,
        VarScope::OtherUser => return None,
    };
    map.get(name)
}

fn explicit_kind(kind: KindArg) -> Option<crate::model::EnvValueKind> {
    match kind {
        KindArg::Auto => None,
        KindArg::String => Some(crate::model::EnvValueKind::String),
        KindArg::ExpandString => Some(crate::model::EnvValueKind::ExpandString),
    }
}

/// Mirrors `CRITICAL_VARS` in `src/components/StagedModal/StagedModal.tsx` —
/// informational only, doesn't block the write.
const CRITICAL_VARS: [&str; 3] = ["SYSTEMROOT", "WINDIR", "COMSPEC"];

fn print_critical_warning(scope: &VarScope, name: &str) {
    if matches!(scope, VarScope::System)
        && CRITICAL_VARS.contains(&name.to_ascii_uppercase().as_str())
    {
        println!(
            "  ⚠ {} is a critical system variable — changing it can break Windows or running applications.",
            name
        );
    }
}
