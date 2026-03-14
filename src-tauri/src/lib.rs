mod state;
mod commands;
mod db;
mod llm;
mod translation;
mod config;

use state::AppState;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                let state = AppState::new(&app_handle).await
                    .expect("Failed to initialize app state");
                app.manage(Arc::new(state));
            });

            // Open devtools in all builds for debugging
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::files::open_file,
            commands::files::read_file_base64,
            commands::files::get_recent_files,
            commands::files::export_annotations_markdown,
            commands::files::export_words_anki,
            commands::words::add_word,
            commands::words::remove_word,
            commands::words::list_words,
            commands::words::update_word,
            commands::annotations::add_annotation,
            commands::annotations::remove_annotation,
            commands::annotations::list_annotations,
            commands::documents::track_document,
            commands::documents::update_progress,
            commands::documents::get_document,
            commands::chat::send_message,
            commands::chat::get_chat_history,
            commands::chat::save_chat_history,
            commands::translate::translate_word,
            commands::translate::translate_batch,
            commands::settings::get_config,
            commands::settings::get_config_json,
            commands::settings::get_config_schema,
            commands::settings::update_config,
            commands::settings::reset_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
