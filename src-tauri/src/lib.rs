use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

/// Build the native menu bar
fn build_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    // File menu
    let new_item = MenuItem::with_id(app, "new", "New Evaluation", true, Some("CmdOrCtrl+N"))?;
    let export_json = MenuItem::with_id(app, "export-json", "Export to JSON...", true, Some("CmdOrCtrl+E"))?;
    let export_csv = MenuItem::with_id(app, "export-csv", "Export to CSV...", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[&new_item, &export_json, &export_csv, &PredefinedMenuItem::separator(app)?, &quit],
    )?;

    // Edit menu
    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    // View menu
    let settings = MenuItem::with_id(app, "settings", "Settings", true, Some("CmdOrCtrl+,"))?;
    let reload = MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?;
    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[&settings, &reload],
    )?;

    // Help menu
    let docs = MenuItem::with_id(app, "docs", "Documentation", true, None::<&str>)?;
    let about = MenuItem::with_id(app, "about", "About Evvl", true, None::<&str>)?;
    let help_menu = Submenu::with_items(app, "Help", true, &[&docs, &about])?;

    // Build the complete menu
    Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &help_menu])
}

/// Build the system tray menu
fn build_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Menu<R>> {
    let show = MenuItem::with_id(app, "show", "Show Evvl", true, None::<&str>)?;
    let new_eval = MenuItem::with_id(app, "tray-new", "New Evaluation", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "tray-quit", "Quit", true, None::<&str>)?;

    Menu::with_items(app, &[&show, &new_eval, &PredefinedMenuItem::separator(app)?, &quit])
}

/// Handle menu events
fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "new" | "tray-new" => {
            // Emit event to frontend to create new evaluation
            let _ = app.emit("menu-new-evaluation", ());
        }
        "export-json" => {
            let _ = app.emit("menu-export-json", ());
        }
        "export-csv" => {
            let _ = app.emit("menu-export-csv", ());
        }
        "settings" => {
            // Navigate to settings page
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.href = '/settings'");
            }
        }
        "reload" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.eval("window.location.reload()");
            }
        }
        "docs" => {
            let _ = open::that("https://github.com/yourusername/evvl#readme");
        }
        "about" => {
            let _ = app.emit("menu-about", ());
        }
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" | "tray-quit" => {
            app.exit(0);
        }
        _ => {}
    }
}

/// Setup system tray
fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let tray_menu = build_tray_menu(app)?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .on_menu_event(move |app, event| handle_menu_event(app, event))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Build and set the menu
            let menu = build_menu(&app.handle())?;
            app.set_menu(menu)?;

            // Setup system tray
            setup_tray(&app.handle())?;

            // Register global shortcuts
            app.global_shortcut().on_shortcut("CommandOrControl+N", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    let _ = app_handle.emit("shortcut-new-evaluation", ());
                }
            })?;

            app.global_shortcut().on_shortcut("CommandOrControl+E", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    let _ = app_handle.emit("shortcut-export", ());
                }
            })?;

            app.global_shortcut().on_shortcut("CommandOrControl+,", {
                let app_handle = app.handle().clone();
                move |_app, _shortcut, _event| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.eval("window.location.href = '/settings'");
                    }
                }
            })?;

            Ok(())
        })
        .on_menu_event(|app, event| handle_menu_event(app, event))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
