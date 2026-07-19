use serde::{Deserialize, Serialize};

const REPO_LATEST_RELEASE_URL: &str =
    "https://api.github.com/repos/iray-tno/envarly/releases/latest";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub url: String,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    html_url: String,
}

/// Checks GitHub for a newer release than the running version. Returns `None`
/// on any failure (offline, rate-limited, etc.) — this is a best-effort,
/// non-critical check and should never surface an error to the user.
#[tauri::command]
pub async fn check_for_update() -> Option<UpdateInfo> {
    match fetch_latest_release().await {
        Ok(info) => info,
        Err(e) => {
            eprintln!("update check failed: {e}");
            None
        }
    }
}

async fn fetch_latest_release() -> Result<Option<UpdateInfo>, reqwest::Error> {
    let client = reqwest::Client::builder()
        .user_agent(concat!("envarly/", env!("CARGO_PKG_VERSION")))
        .build()?;

    let release: GithubRelease = client
        .get(REPO_LATEST_RELEASE_URL)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let latest = release.tag_name.trim_start_matches('v');
    let current = env!("CARGO_PKG_VERSION");

    Ok(if is_newer(latest, current) {
        Some(UpdateInfo {
            version: latest.to_string(),
            url: release.html_url,
        })
    } else {
        None
    })
}

fn parse_version(v: &str) -> Vec<u32> {
    v.split('.').map(|part| part.parse().unwrap_or(0)).collect()
}

fn is_newer(candidate: &str, current: &str) -> bool {
    parse_version(candidate) > parse_version(current)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_newer_detects_patch_bump() {
        assert!(is_newer("1.2.2", "1.2.1"));
        assert!(!is_newer("1.2.1", "1.2.1"));
        assert!(!is_newer("1.2.0", "1.2.1"));
    }

    #[test]
    fn is_newer_detects_minor_and_major_bump() {
        assert!(is_newer("1.3.0", "1.2.9"));
        assert!(is_newer("2.0.0", "1.9.9"));
        assert!(!is_newer("1.9.9", "2.0.0"));
    }

    #[test]
    fn is_newer_handles_missing_segments() {
        assert!(is_newer("1.3", "1.2.9"));
        assert!(!is_newer("1.2", "1.2.1"));
    }
}
