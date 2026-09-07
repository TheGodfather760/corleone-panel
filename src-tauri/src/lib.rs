use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let bytes = include_bytes!("../icons/icon.png");
            let img = image::load_from_memory(bytes).unwrap().to_rgba8();
            let (w, h) = img.dimensions();
            let icon = tauri::image::Image::new_owned(img.into_raw(), w, h);
            let _ = window.set_icon(icon);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
