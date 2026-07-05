export interface EnvDescription {
  category: string;
  summary: string;
}

const descriptions: Record<string, EnvDescription> = {
  // Windows OS
  PATH: { category: "Windows", summary: "Directories searched for executable files. Programs like Node, Python, and Git are found here." },
  PATHEXT: { category: "Windows", summary: "File extensions treated as executables by the shell (e.g. .COM;.EXE;.BAT)." },
  SYSTEMROOT: { category: "Windows", summary: "Root directory of the Windows installation (typically C:\\Windows). Same as WINDIR." },
  WINDIR: { category: "Windows", summary: "Root directory of the Windows installation (typically C:\\Windows). Same as SYSTEMROOT." },
  COMSPEC: { category: "Windows", summary: "Path to the command interpreter (cmd.exe). Used by shell() calls and scripts." },
  TEMP: { category: "Windows", summary: "Directory for temporary files. Many programs write scratch data here." },
  TMP: { category: "Windows", summary: "Fallback directory for temporary files; same purpose as TEMP." },
  USERPROFILE: { category: "Windows", summary: "Current user's home directory (e.g. C:\\Users\\Alice). Maps to ~ in shells." },
  HOMEPATH: { category: "Windows", summary: "Home directory path relative to the drive (e.g. \\Users\\Alice). Prefer USERPROFILE." },
  HOMEDRIVE: { category: "Windows", summary: "Drive letter of the user's home directory (e.g. C:). Used together with HOMEPATH." },
  APPDATA: { category: "Windows", summary: "Roaming app data folder for the current user. Suitable for settings that sync across machines." },
  LOCALAPPDATA: { category: "Windows", summary: "Local (non-roaming) app data folder. Used for caches and large data that should not sync." },
  PROGRAMFILES: { category: "Windows", summary: "Default install directory for 64-bit programs (e.g. C:\\Program Files)." },
  "PROGRAMFILES(X86)": { category: "Windows", summary: "Default install directory for 32-bit programs on 64-bit Windows." },
  PROGRAMDATA: { category: "Windows", summary: "Per-machine app data shared across all users (replaces the older All Users profile)." },
  COMPUTERNAME: { category: "Windows", summary: "NetBIOS name of the current machine. Used by network tools and scripts." },
  USERNAME: { category: "Windows", summary: "Login name of the current user. Read-only; set by Windows at logon." },
  USERDOMAIN: { category: "Windows", summary: "Domain or workgroup the current user belongs to." },
  OS: { category: "Windows", summary: "Operating system identifier (always Windows_NT on modern Windows). Used by legacy scripts." },
  PROCESSOR_ARCHITECTURE: { category: "Windows", summary: "CPU architecture of the current process (AMD64, x86, ARM64). Differs for 32-bit processes on 64-bit OS." },
  NUMBER_OF_PROCESSORS: { category: "Windows", summary: "Number of logical CPU cores. Useful for setting parallelism in build tools." },
  SYSTEMDRIVE: { category: "Windows", summary: "Drive letter where Windows is installed (e.g. C:)." },
  PUBLIC: { category: "Windows", summary: "Shared public profile directory accessible to all users (e.g. C:\\Users\\Public)." },
  ALLUSERSPROFILE: { category: "Windows", summary: "Legacy alias for C:\\ProgramData. Points to the per-machine shared data directory." },
  ONEDRIVE: { category: "Windows", summary: "Path to the user's OneDrive sync folder. Set by the OneDrive client." },
  PSMODULEPATH: { category: "Windows", summary: "Semicolon-separated list of directories where PowerShell looks for modules." },
  DRIVERDATA: { category: "Windows", summary: "Directory for driver data files shared between kernel and user mode." },

  // Network / proxy
  HTTP_PROXY: { category: "Network", summary: "HTTP proxy URL used by curl, wget, Python requests, and many CLI tools." },
  HTTPS_PROXY: { category: "Network", summary: "HTTPS proxy URL. Takes precedence over HTTP_PROXY for HTTPS requests." },
  NO_PROXY: { category: "Network", summary: "Comma-separated list of hostnames/domains that bypass the proxy." },
  ALL_PROXY: { category: "Network", summary: "Catch-all proxy for protocols not covered by HTTP_PROXY or HTTPS_PROXY." },
  SSL_CERT_FILE: { category: "Network", summary: "Path to a CA certificate bundle. Overrides the default trust store for SSL/TLS verification." },
  CURL_CA_BUNDLE: { category: "Network", summary: "Path to a CA certificate bundle used by libcurl (curl, Python requests, etc.)." },
  REQUESTS_CA_BUNDLE: { category: "Network", summary: "Path to a CA bundle used specifically by the Python requests library." },

  // Java
  JAVA_HOME: { category: "Java", summary: "JDK/JRE installation root. Referenced by Maven, Gradle, IDEs, and any tool that invokes Java." },
  CLASSPATH: { category: "Java", summary: "Semicolon-separated list of JAR/class directories on the Java class search path." },
  JVM_OPTS: { category: "Java", summary: "JVM flags applied to all Java processes (e.g. heap size -Xmx). Tool-specific overrides exist." },
  MAVEN_HOME: { category: "Java", summary: "Maven installation directory. Used by the mvn wrapper to locate the embedded Maven." },
  MAVEN_OPTS: { category: "Java", summary: "JVM options passed to the Maven process (e.g. -Xmx512m)." },
  GRADLE_HOME: { category: "Java", summary: "Gradle installation directory. Referenced by the gradle wrapper." },
  GRADLE_OPTS: { category: "Java", summary: "JVM options for the Gradle daemon (e.g. -Xmx2g -XX:MaxMetaspaceSize=512m)." },

  // Python
  PYTHONPATH: { category: "Python", summary: "Semicolon-separated directories added to Python's module search path before the standard library." },
  PYTHONHOME: { category: "Python", summary: "Alternate Python installation root. Overrides the default standard library location." },
  VIRTUAL_ENV: { category: "Python", summary: "Path to the currently active virtualenv. Set automatically when you run activate." },
  CONDA_DEFAULT_ENV: { category: "Python", summary: "Name of the currently active conda environment." },
  CONDA_PREFIX: { category: "Python", summary: "Path to the currently active conda environment directory." },
  PYENV_ROOT: { category: "Python", summary: "Directory where pyenv stores Python installations and shims." },
  PIP_INDEX_URL: { category: "Python", summary: "Custom PyPI index URL. Useful for private package registries or mirrors." },
  PYTHONDONTWRITEBYTECODE: { category: "Python", summary: "Prevents Python from writing .pyc bytecode files when set to 1. Useful in containers." },
  PYTHONUNBUFFERED: { category: "Python", summary: "Disables output buffering for stdout/stderr when set to 1. Ensures logs appear immediately." },

  // Node.js
  NODE_PATH: { category: "Node.js", summary: "Semicolon-separated directories searched for Node.js modules before node_modules." },
  NODE_ENV: { category: "Node.js", summary: "Conventional runtime mode flag (production/development/test). Libraries change behaviour based on this." },
  NODE_OPTIONS: { category: "Node.js", summary: "Command-line options applied to every Node.js process (e.g. --max-old-space-size=4096)." },
  NPM_CONFIG_PREFIX: { category: "Node.js", summary: "Directory where npm installs global packages and binaries." },
  NVM_HOME: { category: "Node.js", summary: "nvm-windows installation directory." },
  NVM_SYMLINK: { category: "Node.js", summary: "Symlink pointing to the currently active Node.js version under nvm-windows." },
  PNPM_HOME: { category: "Node.js", summary: "Directory where pnpm stores globally installed package binaries." },

  // Go
  GOPATH: { category: "Go", summary: "Go workspace root. Contains src/, pkg/, and bin/; also used for go install output." },
  GOROOT: { category: "Go", summary: "Go installation directory. Set automatically by most installers; rarely needs manual configuration." },
  GOBIN: { category: "Go", summary: "Directory where go install places compiled binaries. Defaults to $GOPATH/bin." },
  GOPROXY: { category: "Go", summary: "Proxy URL for downloading Go modules. Default is proxy.golang.org; set to a private proxy as needed." },
  GOMODCACHE: { category: "Go", summary: "Directory where Go stores downloaded module source code. Defaults to $GOPATH/pkg/mod." },
  CGO_ENABLED: { category: "Go", summary: "Enables (1) or disables (0) cgo. Disable for fully static cross-compiled binaries." },
  GOPRIVATE: { category: "Go", summary: "Comma-separated module path prefixes treated as private; skips proxy and checksum database." },
  GONOSUMDB: { category: "Go", summary: "Module prefixes that bypass the Go checksum database. Subset of GOPRIVATE." },
  GOFLAGS: { category: "Go", summary: "Default flags applied to every go command. Useful for setting -mod=vendor globally." },

  // Rust
  CARGO_HOME: { category: "Rust", summary: "Cargo home directory containing the registry cache, crate sources, and installed binaries." },
  RUSTUP_HOME: { category: "Rust", summary: "Directory where rustup stores toolchains and components." },
  RUSTFLAGS: { category: "Rust", summary: "Compiler flags passed to every rustc invocation in the workspace." },
  RUST_LOG: { category: "Rust", summary: "Log filter for the env_logger crate (e.g. debug, myapp=trace). Used by many Rust applications." },
  RUST_BACKTRACE: { category: "Rust", summary: "Enables panic backtraces. Set to 1 for basic or full for complete traces." },
  CARGO_TARGET_DIR: { category: "Rust", summary: "Override for the build output directory. Useful to share a target dir across workspaces." },

  // .NET
  DOTNET_ROOT: { category: ".NET", summary: ".NET runtime installation root. Used by the dotnet CLI to locate runtimes and SDKs." },
  NUGET_PACKAGES: { category: ".NET", summary: "Directory where NuGet caches downloaded packages. Defaults to %USERPROFILE%\\.nuget\\packages." },
  DOTNET_CLI_TELEMETRY_OPTOUT: { category: ".NET", summary: "Set to 1 to disable telemetry collection by the .NET CLI." },
  DOTNET_ENVIRONMENT: { category: ".NET", summary: "Runtime environment name (Development/Staging/Production). Overrides appsettings selection." },
  ASPNETCORE_ENVIRONMENT: { category: ".NET", summary: "ASP.NET Core environment name. Controls which appsettings.{env}.json and middleware are loaded." },
  ASPNETCORE_URLS: { category: ".NET", summary: "Semicolon-separated URLs the ASP.NET Core server listens on (e.g. http://localhost:5000)." },

  // C / C++
  CC: { category: "C/C++", summary: "Default C compiler command. Respected by make, cmake, and autotools." },
  CXX: { category: "C/C++", summary: "Default C++ compiler command. Respected by make, cmake, and autotools." },
  CFLAGS: { category: "C/C++", summary: "Compiler flags for C compilation (e.g. -O2 -Wall). Passed to CC by most build systems." },
  CXXFLAGS: { category: "C/C++", summary: "Compiler flags for C++ compilation. Passed to CXX by most build systems." },
  LDFLAGS: { category: "C/C++", summary: "Linker flags (e.g. -L/usr/local/lib). Passed during the link step." },
  INCLUDE: { category: "C/C++", summary: "Semicolon-separated directories searched for header files by MSVC." },
  LIB: { category: "C/C++", summary: "Semicolon-separated directories searched for import libraries by the MSVC linker." },

  // Android
  ANDROID_HOME: { category: "Android", summary: "Android SDK installation root. Used by Gradle, Flutter, and React Native build tools." },
  ANDROID_SDK_ROOT: { category: "Android", summary: "Alias for ANDROID_HOME. Preferred name in newer Android tooling." },
  ANDROID_NDK_HOME: { category: "Android", summary: "Android NDK installation directory. Required for building native (C/C++) Android code." },

  // Git
  GIT_EDITOR: { category: "Git", summary: "Editor invoked by git for commit messages and interactive rebase. Overrides core.editor." },
  GIT_SSH_COMMAND: { category: "Git", summary: "SSH command used by Git for remote operations (e.g. to specify a key file)." },
  GIT_HTTP_PROXY_AUTHMETHOD: { category: "Git", summary: "Authentication method for HTTPS Git operations through a proxy." },
  GIT_AUTHOR_NAME: { category: "Git", summary: "Author name for new commits. Overrides user.name in .gitconfig." },
  GIT_AUTHOR_EMAIL: { category: "Git", summary: "Author email for new commits. Overrides user.email in .gitconfig." },
  GIT_COMMITTER_NAME: { category: "Git", summary: "Committer name recorded in new commits. Overrides user.name in .gitconfig." },
  GIT_COMMITTER_EMAIL: { category: "Git", summary: "Committer email recorded in new commits. Overrides user.email in .gitconfig." },

  // Docker
  DOCKER_HOST: { category: "Docker", summary: "Docker daemon socket or TCP address. Points the CLI to a remote or alternative daemon." },
  DOCKER_TLS_VERIFY: { category: "Docker", summary: "Enables TLS verification when communicating with a remote Docker daemon." },
  DOCKER_CERT_PATH: { category: "Docker", summary: "Directory containing TLS certificates for secure Docker daemon connections." },
  COMPOSE_FILE: { category: "Docker", summary: "Path(s) to the Docker Compose file(s) used when running docker compose commands." },
  DOCKER_BUILDKIT: { category: "Docker", summary: "Enables BuildKit (next-generation Docker build backend) when set to 1." },

  // AWS
  AWS_ACCESS_KEY_ID: { category: "AWS", summary: "AWS access key for authenticating SDK and CLI requests. Pair with AWS_SECRET_ACCESS_KEY." },
  AWS_SECRET_ACCESS_KEY: { category: "AWS", summary: "Secret key paired with AWS_ACCESS_KEY_ID for AWS authentication." },
  AWS_SESSION_TOKEN: { category: "AWS", summary: "Temporary session token for assumed roles or federated access." },
  AWS_REGION: { category: "AWS", summary: "Default AWS region for API calls (e.g. us-east-1). Overrides the profile's region." },
  AWS_DEFAULT_REGION: { category: "AWS", summary: "Fallback default region. AWS_REGION takes precedence when both are set." },
  AWS_PROFILE: { category: "AWS", summary: "Named profile from ~/.aws/credentials to use. Overrides the [default] profile." },

  // GCP
  GOOGLE_APPLICATION_CREDENTIALS: { category: "GCP", summary: "Path to a service account JSON key file. Used by Google Cloud client libraries for authentication." },
  GCLOUD_PROJECT: { category: "GCP", summary: "Default GCP project ID used by gcloud commands and some client libraries." },
  CLOUDSDK_CORE_PROJECT: { category: "GCP", summary: "Explicit project override for the Cloud SDK. Same purpose as GCLOUD_PROJECT." },

  // Azure
  AZURE_SUBSCRIPTION_ID: { category: "Azure", summary: "Default Azure subscription ID used by the Azure CLI and SDKs." },
  AZURE_TENANT_ID: { category: "Azure", summary: "Azure Active Directory tenant ID for authentication." },
  AZURE_CLIENT_ID: { category: "Azure", summary: "Service principal client (application) ID for Azure SDK authentication." },
  AZURE_CLIENT_SECRET: { category: "Azure", summary: "Secret for the service principal identified by AZURE_CLIENT_ID." },

  // Generic dev
  EDITOR: { category: "Dev tools", summary: "Preferred terminal text editor. Used by git, cron, and many shell utilities." },
  VISUAL: { category: "Dev tools", summary: "Preferred visual (GUI-capable) editor. Falls back to EDITOR for terminal contexts." },
  DATABASE_URL: { category: "Dev tools", summary: "Database connection string. Conventional variable used by ORMs and frameworks like Rails and Django." },
  DEBUG: { category: "Dev tools", summary: "Debug logging namespace filter for the debug npm package and compatible tools (e.g. express:*)." },
  LOG_LEVEL: { category: "Dev tools", summary: "Logging verbosity threshold (e.g. debug, info, warn, error) for the running application." },
  PORT: { category: "Dev tools", summary: "TCP port the server process should listen on. Used by many web frameworks by convention." },
  HOST: { category: "Dev tools", summary: "Hostname or IP address the server should bind to (e.g. 0.0.0.0 or localhost)." },
  TZ: { category: "Dev tools", summary: "IANA timezone name (e.g. America/New_York). Overrides the system timezone for the process." },
  LANG: { category: "Dev tools", summary: "Default locale for the process (e.g. en_US.UTF-8). Affects character encoding and sorting." },
};

export function lookupEnvDescription(name: string): EnvDescription | null {
  return descriptions[name.toUpperCase()] ?? null;
}
