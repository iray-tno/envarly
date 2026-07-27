use crate::error::EnvarlyError;
use crate::user_hive::{self, LocalAccount};

#[tauri::command]
pub fn list_local_accounts() -> Result<Vec<LocalAccount>, EnvarlyError> {
    user_hive::list_local_accounts()
}

/// Switch the active other-user account. `None` deselects (unloading any
/// hive Envarly itself loaded). The frontend should re-fetch vars/snapshot
/// after this resolves — it doesn't change any other command's signature.
#[tauri::command]
pub fn select_account(sid: Option<String>) -> Result<Option<LocalAccount>, EnvarlyError> {
    user_hive::select_account(sid.as_deref())
}

#[tauri::command]
pub fn get_selected_account() -> Option<LocalAccount> {
    user_hive::selected_account()
}
