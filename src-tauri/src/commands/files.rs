use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;
use sha2::{Sha256, Digest};

#[derive(Serialize)]
pub struct FileInfo {
    pub path: String,
    pub hash: String,
    pub name: String,
}

#[tauri::command]
pub async fn open_file(path: String, state: tauri::State<'_, Arc<AppState>>) -> Result<FileInfo, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let hash = hex::encode(Sha256::digest(&bytes));
    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    // Track in DB
    sqlx::query(
        "INSERT INTO documents (path, hash, title, last_opened) VALUES (?, ?, ?, datetime('now')) \
         ON CONFLICT(hash) DO UPDATE SET path = excluded.path, last_opened = datetime('now')"
    )
    .bind(&path)
    .bind(&hash)
    .bind(&name)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(FileInfo { path, hash, name })
}

#[derive(Serialize)]
pub struct RecentFile {
    pub path: String,
    pub hash: String,
    pub title: Option<String>,
    pub last_page: i64,
    pub last_opened: String,
}

#[tauri::command]
pub async fn get_recent_files(state: tauri::State<'_, Arc<AppState>>) -> Result<Vec<RecentFile>, String> {
    let rows = sqlx::query_as::<_, (String, String, Option<String>, i64, String)>(
        "SELECT path, hash, title, last_page, last_opened FROM documents ORDER BY last_opened DESC LIMIT 20"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|(path, hash, title, last_page, last_opened)| {
        RecentFile { path, hash, title, last_page, last_opened }
    }).collect())
}

#[tauri::command]
pub async fn export_annotations_markdown(
    document_hash: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<String, String> {
    let rows = sqlx::query_as::<_, (i64, String, Option<String>, String)>(
        "SELECT page, type, content, created_at FROM annotations WHERE document_hash = ? ORDER BY page, created_at"
    )
    .bind(&document_hash)
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let mut md = String::from("# Annotations\n\n");
    for (page, ann_type, content, created_at) in rows {
        md.push_str(&format!("## Page {} — {} ({})\n\n", page, ann_type, created_at));
        if let Some(c) = content {
            md.push_str(&c);
            md.push_str("\n\n");
        }
    }
    Ok(md)
}

#[tauri::command]
pub async fn export_words_anki(state: tauri::State<'_, Arc<AppState>>) -> Result<String, String> {
    let sep = {
        let config = state.config.lock().map_err(|e| e.to_string())?;
        config.export.anki_field_separator.clone()
    };

    let rows = sqlx::query_as::<_, (String, String, Option<String>)>(
        "SELECT word, translation, context FROM difficult_words ORDER BY created_at"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let mut tsv = String::new();
    for (word, translation, context) in rows {
        tsv.push_str(&word);
        tsv.push_str(&sep);
        tsv.push_str(&translation);
        if let Some(ctx) = context {
            tsv.push_str(&sep);
            tsv.push_str(&ctx);
        }
        tsv.push('\n');
    }
    Ok(tsv)
}
