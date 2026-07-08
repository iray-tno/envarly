export interface EnvDescription {
  categoryKey: string;
  summaryKey: string;
}

const vars: Record<string, string> = {
  // Windows
  PATH: "windows",
  PATHEXT: "windows",
  SYSTEMROOT: "windows",
  WINDIR: "windows",
  COMSPEC: "windows",
  TEMP: "windows",
  TMP: "windows",
  USERPROFILE: "windows",
  HOMEPATH: "windows",
  HOMEDRIVE: "windows",
  APPDATA: "windows",
  LOCALAPPDATA: "windows",
  PROGRAMFILES: "windows",
  "PROGRAMFILES(X86)": "windows",
  PROGRAMDATA: "windows",
  COMPUTERNAME: "windows",
  USERNAME: "windows",
  USERDOMAIN: "windows",
  OS: "windows",
  PROCESSOR_ARCHITECTURE: "windows",
  NUMBER_OF_PROCESSORS: "windows",
  SYSTEMDRIVE: "windows",
  PUBLIC: "windows",
  ALLUSERSPROFILE: "windows",
  ONEDRIVE: "windows",
  ONEDRIVECONSUMER: "windows",
  ONEDRIVECOMMERCIAL: "windows",
  PSMODULEPATH: "windows",
  DRIVERDATA: "windows",
  PROCESSOR_IDENTIFIER: "windows",
  PROCESSOR_LEVEL: "windows",
  PROCESSOR_REVISION: "windows",
  POWERSHELL_DISTRIBUTION_CHANNEL: "windows",

  // Network
  HTTP_PROXY: "network",
  HTTPS_PROXY: "network",
  NO_PROXY: "network",
  ALL_PROXY: "network",
  SSL_CERT_FILE: "network",
  CURL_CA_BUNDLE: "network",
  REQUESTS_CA_BUNDLE: "network",

  // Java
  JAVA_HOME: "java",
  CLASSPATH: "java",
  JVM_OPTS: "java",
  MAVEN_HOME: "java",
  MAVEN_OPTS: "java",
  GRADLE_HOME: "java",
  GRADLE_OPTS: "java",

  // Python
  PYTHONPATH: "python",
  PYTHONHOME: "python",
  VIRTUAL_ENV: "python",
  CONDA_DEFAULT_ENV: "python",
  CONDA_PREFIX: "python",
  PYENV_ROOT: "python",
  PIP_INDEX_URL: "python",
  PYTHONDONTWRITEBYTECODE: "python",
  PYTHONUNBUFFERED: "python",

  // Node.js
  NODE_PATH: "nodejs",
  NODE_ENV: "nodejs",
  NODE_OPTIONS: "nodejs",
  NPM_CONFIG_PREFIX: "nodejs",
  NVM_HOME: "nodejs",
  NVM_SYMLINK: "nodejs",
  PNPM_HOME: "nodejs",

  // Go
  GOPATH: "go",
  GOROOT: "go",
  GOBIN: "go",
  GOPROXY: "go",
  GOMODCACHE: "go",
  CGO_ENABLED: "go",
  GOPRIVATE: "go",
  GONOSUMDB: "go",
  GOFLAGS: "go",

  // Rust
  CARGO_HOME: "rust",
  RUSTUP_HOME: "rust",
  RUSTFLAGS: "rust",
  RUST_LOG: "rust",
  RUST_BACKTRACE: "rust",
  CARGO_TARGET_DIR: "rust",

  // .NET
  DOTNET_ROOT: "dotnet",
  NUGET_PACKAGES: "dotnet",
  DOTNET_CLI_TELEMETRY_OPTOUT: "dotnet",
  DOTNET_ENVIRONMENT: "dotnet",
  ASPNETCORE_ENVIRONMENT: "dotnet",
  ASPNETCORE_URLS: "dotnet",

  // C/C++
  CC: "cpp",
  CXX: "cpp",
  CFLAGS: "cpp",
  CXXFLAGS: "cpp",
  LDFLAGS: "cpp",
  INCLUDE: "cpp",
  LIB: "cpp",

  // Android
  ANDROID_HOME: "android",
  ANDROID_SDK_ROOT: "android",
  ANDROID_NDK_HOME: "android",

  // Git
  GIT_EDITOR: "git",
  GIT_SSH_COMMAND: "git",
  GIT_HTTP_PROXY_AUTHMETHOD: "git",
  GIT_AUTHOR_NAME: "git",
  GIT_AUTHOR_EMAIL: "git",
  GIT_COMMITTER_NAME: "git",
  GIT_COMMITTER_EMAIL: "git",

  // Docker
  DOCKER_HOST: "docker",
  DOCKER_TLS_VERIFY: "docker",
  DOCKER_CERT_PATH: "docker",
  COMPOSE_FILE: "docker",
  DOCKER_BUILDKIT: "docker",

  // AWS
  AWS_ACCESS_KEY_ID: "aws",
  AWS_SECRET_ACCESS_KEY: "aws",
  AWS_SESSION_TOKEN: "aws",
  AWS_REGION: "aws",
  AWS_DEFAULT_REGION: "aws",
  AWS_PROFILE: "aws",

  // GCP
  GOOGLE_APPLICATION_CREDENTIALS: "gcp",
  GCLOUD_PROJECT: "gcp",
  CLOUDSDK_CORE_PROJECT: "gcp",

  // Azure
  AZURE_SUBSCRIPTION_ID: "azure",
  AZURE_TENANT_ID: "azure",
  AZURE_CLIENT_ID: "azure",
  AZURE_CLIENT_SECRET: "azure",

  // GPU / CUDA
  CUDA_PATH: "gpu",
  CUDA_HOME: "gpu",
  CUDA_VISIBLE_DEVICES: "gpu",
  NVIDIA_VISIBLE_DEVICES: "gpu",
  NVIDIA_DRIVER_CAPABILITIES: "gpu",
  ROCM_PATH: "gpu",
  HIP_PATH: "gpu",
  HIP_VISIBLE_DEVICES: "gpu",
  OPENCL_VENDOR_PATH: "gpu",

  // Dev tools
  EDITOR: "devtools",
  VISUAL: "devtools",
  DATABASE_URL: "devtools",
  DEBUG: "devtools",
  LOG_LEVEL: "devtools",
  PORT: "devtools",
  HOST: "devtools",
  TZ: "devtools",
  LANG: "devtools",
};

export function lookupEnvDescription(name: string): EnvDescription | null {
  const upper = name.toUpperCase();
  const catId = vars[upper];
  if (!catId) return null;
  return {
    categoryKey: `env_desc.categories.${catId}`,
    summaryKey: `env_desc.${upper}`,
  };
}
