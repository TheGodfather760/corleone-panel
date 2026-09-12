use tauri::{Manager, menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}};
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;

const PROFILE_ID: &str = "436F726C656F6E65";
const TRANSFER_FILES: &[&str] = &["controls.sii", "config.cfg", "config_local.cfg", "config-ROOT.cfg"];

#[tauri::command]
fn get_ets2_profile_status() -> serde_json::Value {
    let docs = match dirs::document_dir() {
        Some(d) => d,
        None => return serde_json::json!({ "found": false }),
    };
    let profile_path = docs
        .join("Euro Truck Simulator 2")
        .join("profiles")
        .join(PROFILE_ID);

    if !profile_path.exists() {
        return serde_json::json!({ "found": false });
    }

    // Aktarılabilecek dosyaları tara
    let mut transferable: Vec<String> = TRANSFER_FILES
        .iter()
        .filter(|f| profile_path.join(f).exists())
        .map(|f| f.to_string())
        .collect();

    // gearbox_layout_*.sii wildcard
    if let Ok(entries) = std::fs::read_dir(&profile_path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("gearbox_layout_") && name.ends_with(".sii") {
                transferable.push(name);
            }
        }
    }

    // corleone_version.txt oku
    let installed_version = std::fs::read_to_string(profile_path.join("corleone_version.txt"))
        .ok()
        .map(|s| s.trim().to_string());

    serde_json::json!({ "found": true, "transferable": transferable, "installed_version": installed_version })
}

#[tauri::command]
async fn install_ets2_profile(zip_url: String, transfer_files: Vec<String>, token: String, version: String) -> Result<(), String> {
    let docs = dirs::document_dir().ok_or("Documents klasörü bulunamadı")?;
    let profiles_dir = docs.join("Euro Truck Simulator 2").join("profiles");
    let profile_path = profiles_dir.join(PROFILE_ID);

    // Aktarılacak dosyaları oku
    let mut saved: Vec<(String, Vec<u8>)> = Vec::new();
    if profile_path.exists() {
        for fname in &transfer_files {
            let fpath = profile_path.join(fname);
            if let Ok(data) = std::fs::read(&fpath) {
                saved.push((fname.clone(), data));
            }
        }

        // Yedek zip oluştur
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

        // Eski klasörü sil
        std::fs::remove_dir_all(&profile_path).map_err(|e| e.to_string())?;
    }

    // Zip indir
    let client = reqwest::Client::new();
    let resp = client
        .get(&zip_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;

    // Zip aç
    std::fs::create_dir_all(&profile_path).map_err(|e| e.to_string())?;
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = profile_path.join(file.name());
        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            use std::io::Read;
            let mut buf = Vec::new();
            file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            std::fs::write(&outpath, buf).map_err(|e| e.to_string())?;
        }
    }

    // Aktarilan dosyalari yaz
    for (fname, data) in saved {
        std::fs::write(profile_path.join(&fname), data).map_err(|e| e.to_string())?;
    }

    // Versiyon dosyasini yaz
    if !version.is_empty() {
        std::fs::write(profile_path.join("corleone_version.txt"), &version).map_err(|e| e.to_string())?;
    }

    Ok(())
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
        .invoke_handler(tauri::generate_handler![get_ets2_profile_status, install_ets2_profile])
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
