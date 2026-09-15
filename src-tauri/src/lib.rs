use tauri::{Manager, menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}};
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;

const PROFILE_ID: &str = "436F726C656F6E65";
const TRANSFER_FILES: &[&str] = &["controls.sii", "config.cfg", "config_local.cfg", "config-ROOT.cfg"];

fn get_profile_status_for(game_dir: &str) -> serde_json::Value {
    let docs = match dirs::document_dir() {
        Some(d) => d,
        None => return serde_json::json!({ "found": false }),
    };
    let profile_path = docs.join(game_dir).join("profiles").join(PROFILE_ID);

    if !profile_path.exists() {
        return serde_json::json!({ "found": false });
    }

    let mut transferable: Vec<String> = TRANSFER_FILES
        .iter()
        .filter(|f| profile_path.join(f).exists())
        .map(|f| f.to_string())
        .collect();

    if let Ok(entries) = std::fs::read_dir(&profile_path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("gearbox_layout_") && name.ends_with(".sii") {
                transferable.push(name);
            }
        }
    }

    let installed_version = std::fs::read_to_string(profile_path.join("corleone_version.txt"))
        .ok()
        .map(|s| s.trim().to_string());

    serde_json::json!({ "found": true, "transferable": transferable, "installed_version": installed_version })
}

async fn install_profile_for(game_dir: &str, zip_url: String, transfer_files: Vec<String>, token: String, version: String) -> Result<(), String> {
    let docs = dirs::document_dir().ok_or("Documents klasoru bulunamadi")?;
    let profiles_dir = docs.join(game_dir).join("profiles");
    let profile_path = profiles_dir.join(PROFILE_ID);

    let mut saved: Vec<(String, Vec<u8>)> = Vec::new();
    if profile_path.exists() {
        for fname in &transfer_files {
            let fpath = profile_path.join(fname);
            if let Ok(data) = std::fs::read(&fpath) {
                saved.push((fname.clone(), data));
            }
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let backup_path = profiles_dir.join(format!("{}_backup_{}.zip", PROFILE_ID, now));
        let backup_file = std::fs::File::create(&backup_path).map_err(|e| e.to_string())?;
        let mut zip_writer = zip::ZipWriter::new(backup_file);
        let opts = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);
        if let Ok(entries) = std::fs::read_dir(&profile_path) {
            for entry in entries.flatten() {
                if entry.path().is_file() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if let Ok(data) = std::fs::read(entry.path()) {
                        let _ = zip_writer.start_file(&name, opts);
                        use std::io::Write;
                        let _ = zip_writer.write_all(&data);
                    }
                }
            }
        }
        zip_writer.finish().map_err(|e| e.to_string())?;
        std::fs::remove_dir_all(&profile_path).map_err(|e| e.to_string())?;
    }

    let client = reqwest::Client::new();
    let resp = client
        .get(&zip_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;

    std::fs::create_dir_all(&profile_path).map_err(|e| e.to_string())?;
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let raw_name = file.name().to_string();
        let stripped = raw_name.splitn(2, '/').nth(1).unwrap_or(&raw_name);
        if stripped.is_empty() { continue; }
        let outpath = profile_path.join(stripped);
        if raw_name.ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = outpath.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            use std::io::Read;
            let mut buf = Vec::new();
            file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            std::fs::write(&outpath, buf).map_err(|e| e.to_string())?;
        }
    }

    for (fname, data) in saved {
        std::fs::write(profile_path.join(&fname), data).map_err(|e| e.to_string())?;
    }

    if !version.is_empty() {
        std::fs::write(profile_path.join("corleone_version.txt"), &version).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_game_screenshots(game_dir: String) -> serde_json::Value {
    let docs = match dirs::document_dir() {
        Some(d) => d,
        None => return serde_json::json!({ "files": [] }),
    };
    let screenshots_path = docs.join(&game_dir).join("screenshot");
    if !screenshots_path.exists() {
        return serde_json::json!({ "files": [] });
    }
    let mut files: Vec<serde_json::Value> = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&screenshots_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() { continue; }
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
            if !["jpg", "jpeg", "png", "bmp"].contains(&ext.as_str()) { continue; }
            let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            let modified = path.metadata().ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            files.push(serde_json::json!({
                "name": name,
                "path": path.to_string_lossy(),
                "modified": modified,
            }));
        }
    }
    files.sort_by(|a, b| b["modified"].as_u64().unwrap_or(0).cmp(&a["modified"].as_u64().unwrap_or(0)));
    serde_json::json!({ "files": files })
}

#[tauri::command]
fn get_ets2_profile_status() -> serde_json::Value {
    get_profile_status_for("Euro Truck Simulator 2")
}

#[tauri::command]
fn get_ats_profile_status() -> serde_json::Value {
    get_profile_status_for("American Truck Simulator")
}

#[tauri::command]
async fn install_ets2_profile(zip_url: String, transfer_files: Vec<String>, token: String, version: String) -> Result<(), String> {
    install_profile_for("Euro Truck Simulator 2", zip_url, transfer_files, token, version).await
}

#[tauri::command]
async fn install_ats_profile(zip_url: String, transfer_files: Vec<String>, token: String, version: String) -> Result<(), String> {
    install_profile_for("American Truck Simulator", zip_url, transfer_files, token, version).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--hidden"])))
        .invoke_handler(tauri::generate_handler![get_ets2_profile_status, install_ets2_profile, get_ats_profile_status, install_ats_profile, get_game_screenshots])
        .setup(|app| {
            // Pencere ikonu
            let window = app.get_webview_window("main").unwrap();
            let bytes = include_bytes!("../icons/icon.png");
            let img = image::load_from_memory(bytes).unwrap().to_rgba8();
            let (w, h) = img.dimensions();
            let icon = tauri::image::Image::new_owned(img.into_raw(), w, h);
            let _ = window.set_icon(icon);

            // Autostart etkinleştir (sadece release build'de)
            #[cfg(not(debug_assertions))]
            let _ = app.autolaunch().enable();

            // --hidden argümanıyla başlandıysa pencereyi gizle
            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--hidden".to_string()) {
                let _ = window.hide();
            }

            // System tray
            let show = MenuItem::with_id(app, "show", "Göster", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Çıkış", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); } }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Pencere kapatılınca tray'e küçül
            let win = app.get_webview_window("main").unwrap();
            win.clone().on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = win.hide();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
