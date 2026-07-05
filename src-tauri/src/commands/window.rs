use tauri::WebviewWindow;

#[tauri::command]
pub fn set_window_title(window: WebviewWindow, title: String) -> Result<(), String> {
    window.set_title(&title).map_err(|e| format!("设置窗口标题失败: {}", e))
}
