use crate::state::AppState;
use crate::config::schema;
use std::sync::Arc;
use tauri::Emitter;

#[tauri::command]
pub async fn get_config(state: tauri::State<'_, Arc<AppState>>) -> Result<String, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    toml::to_string_pretty(&*config).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_config_schema() -> Result<String, String> {
    Ok(schema::get_config_schema().to_string())
}

#[tauri::command]
pub async fn update_config(
    section: String,
    key: String,
    value: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.update_field(&section, &key, &value)?;
    config.save().map_err(|e| e.to_string())?;

    let config_json = serde_json::to_string(&*config).map_err(|e| e.to_string())?;
    let _ = app.emit("config:changed", config_json);

    Ok(())
}

#[tauri::command]
pub async fn reset_config(
    section: Option<String>,
    key: Option<String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.reset_section(section.as_deref(), key.as_deref());
    config.save().map_err(|e| e.to_string())?;

    let config_json = serde_json::to_string(&*config).map_err(|e| e.to_string())?;
    let _ = app.emit("config:changed", config_json);

    Ok(())
}
