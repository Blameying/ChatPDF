use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct DocumentInfo {
    pub id: i64,
    pub path: String,
    pub hash: String,
    pub title: Option<String>,
    pub total_pages: Option<i64>,
    pub last_page: i64,
    pub scroll_y: f64,
    pub zoom_level: f64,
    pub last_opened: String,
}

#[tauri::command]
pub async fn track_document(
    path: String,
    hash: String,
    title: Option<String>,
    total_pages: Option<i64>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO documents (path, hash, title, total_pages, last_opened) VALUES (?, ?, ?, ?, datetime('now')) \
         ON CONFLICT(hash) DO UPDATE SET path = excluded.path, title = COALESCE(excluded.title, documents.title), \
         total_pages = COALESCE(excluded.total_pages, documents.total_pages), last_opened = datetime('now')"
    )
    .bind(&path)
    .bind(&hash)
    .bind(&title)
    .bind(total_pages)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn update_progress(
    hash: String,
    last_page: i64,
    scroll_y: f64,
    zoom_level: f64,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE documents SET last_page = ?, scroll_y = ?, zoom_level = ?, last_opened = datetime('now') WHERE hash = ?"
    )
    .bind(last_page)
    .bind(scroll_y)
    .bind(zoom_level)
    .bind(&hash)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_document(hash: String, state: tauri::State<'_, Arc<AppState>>) -> Result<Option<DocumentInfo>, String> {
    let row = sqlx::query_as::<_, (i64, String, String, Option<String>, Option<i64>, i64, f64, f64, String)>(
        "SELECT id, path, hash, title, total_pages, last_page, scroll_y, zoom_level, last_opened \
         FROM documents WHERE hash = ?"
    )
    .bind(&hash)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row.map(|r| DocumentInfo {
        id: r.0, path: r.1, hash: r.2, title: r.3, total_pages: r.4,
        last_page: r.5, scroll_y: r.6, zoom_level: r.7, last_opened: r.8,
    }))
}
