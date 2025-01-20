use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use std::path::Path;

fn sanitize_label(path: &str) -> String {
    path.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '/' || c == ':' || c == '_' { c } else { '_' })
        .collect()
}

pub fn open_editor_window(app_handle: &AppHandle, project_path: &Path) -> Result<(), String> {
    let window_label = format!("editor_{}", sanitize_label(&project_path.to_string_lossy()));
    
    // Check if window already exists
    if let Some(window) = app_handle.get_webview_window(&window_label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create URL with project path
    let encoded_path = urlencoding::encode(&project_path.to_string_lossy()).into_owned();
    let url = format!("index.html#/editor?path={}", encoded_path);
    let url = WebviewUrl::App(url.into());

    // Create new editor window
    let window = WebviewWindowBuilder::new(
        app_handle,
        window_label,
        url
    )
    .title("Warp Code")
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Configure window after creation
    window.maximize().map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;

    Ok(())
}
