use crate::error::EnvarlyError;

/// Encrypt `data` with Windows DPAPI (current-user scope).
/// Only the same Windows user account on the same machine can decrypt.
/// On non-Windows builds this is a no-op passthrough (for CI).
pub fn protect(data: &[u8]) -> Result<Vec<u8>, EnvarlyError> {
    #[cfg(target_os = "windows")]
    return dpapi::protect(data);
    #[cfg(not(target_os = "windows"))]
    return Ok(data.to_vec());
}

/// Decrypt data previously encrypted by `protect`.
pub fn unprotect(data: &[u8]) -> Result<Vec<u8>, EnvarlyError> {
    #[cfg(target_os = "windows")]
    return dpapi::unprotect(data);
    #[cfg(not(target_os = "windows"))]
    return Ok(data.to_vec());
}

#[cfg(target_os = "windows")]
mod dpapi {
    use crate::error::EnvarlyError;
    use std::ptr;
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{
        CryptProtectData, CryptUnprotectData, CRYPT_INTEGER_BLOB,
        CRYPTPROTECT_UI_FORBIDDEN,
    };

    pub fn protect(data: &[u8]) -> Result<Vec<u8>, EnvarlyError> {
        unsafe {
            let mut input = CRYPT_INTEGER_BLOB {
                cbData: data.len() as u32,
                pbData: data.as_ptr() as *mut u8,
            };
            let mut output = CRYPT_INTEGER_BLOB { cbData: 0, pbData: ptr::null_mut() };

            let ok = CryptProtectData(
                &mut input,
                ptr::null(),
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut output,
            );
            if ok == 0 {
                return Err(EnvarlyError::Snapshot(format!(
                    "CryptProtectData failed: {}",
                    std::io::Error::last_os_error()
                )));
            }

            let encrypted =
                std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
            LocalFree(output.pbData as *mut core::ffi::c_void);
            Ok(encrypted)
        }
    }

    pub fn unprotect(data: &[u8]) -> Result<Vec<u8>, EnvarlyError> {
        unsafe {
            let mut input = CRYPT_INTEGER_BLOB {
                cbData: data.len() as u32,
                pbData: data.as_ptr() as *mut u8,
            };
            let mut output = CRYPT_INTEGER_BLOB { cbData: 0, pbData: ptr::null_mut() };

            let ok = CryptUnprotectData(
                &mut input,
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                ptr::null_mut(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut output,
            );
            if ok == 0 {
                return Err(EnvarlyError::Snapshot(format!(
                    "CryptUnprotectData failed: {}",
                    std::io::Error::last_os_error()
                )));
            }

            let decrypted =
                std::slice::from_raw_parts(output.pbData, output.cbData as usize).to_vec();
            LocalFree(output.pbData as *mut core::ffi::c_void);
            Ok(decrypted)
        }
    }
}
