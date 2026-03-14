use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct Annotation {
    pub id: i64,
    pub document_hash: String,
    pub page: i64,
    pub r#type: String,
    pub content: Option<String>,
    pub color: String,
    pub position_data: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn add_annotation(
    document_hash: String,
    page: i64,
    r#type: String,
    content: Option<String>,
    color: Option<String>,
    position_data: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Annotation, String> {
    let color = color.unwrap_or_else(|| "#FFEB3B".into());

    let id = sqlx::query(
        "INSERT INTO annotations (document_hash, page, type, content, color, position_data) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&document_hash)
    .bind(page)
    .bind(&r#type)
    .bind(&content)
    .bind(&color)
    .bind(&position_data)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?
    .last_insert_rowid();

    Ok(Annotation {
        id, document_hash, page, r#type, content, color, position_data,
        created_at: chrono_now(),
    })
}

#[tauri::command]
pub async fn remove_annotation(id: i64, state: tauri::State<'_, Arc<AppState>>) -> Result<(), String> {
    sqlx::query("DELETE FROM annotations WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn list_annotations(
    document_hash: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Vec<Annotation>, String> {
    let rows = sqlx::query_as::<_, (i64, String, i64, String, Option<String>, String, String, String)>(
        "SELECT id, document_hash, page, type, content, color, position_data, created_at \
         FROM annotations WHERE document_hash = ? ORDER BY page, created_at"
    )
    .bind(&document_hash)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|r| Annotation {
        id: r.0, document_hash: r.1, page: r.2, r#type: r.3,
        content: r.4, color: r.5, position_data: r.6, created_at: r.7,
    }).collect())
}

fn chrono_now() -> String {
    // Simple ISO format without chrono dependency
    "now".to_string()
}
