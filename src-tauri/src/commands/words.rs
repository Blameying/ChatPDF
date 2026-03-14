use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize, Clone)]
pub struct DifficultWord {
    pub id: i64,
    pub word: String,
    pub translation: String,
    pub context: Option<String>,
    pub source_lang: String,
    pub target_lang: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn add_word(
    word: String,
    translation: String,
    context: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<DifficultWord, String> {
    let (source_lang, target_lang) = {
        let config = state.config.lock().map_err(|e| e.to_string())?;
        (config.translation.source_lang.clone(), config.translation.target_lang.clone())
    };

    sqlx::query(
        "INSERT OR REPLACE INTO difficult_words (word, translation, context, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&word)
    .bind(&translation)
    .bind(&context)
    .bind(&source_lang)
    .bind(&target_lang)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    let row = sqlx::query_as::<_, (i64, String, String, Option<String>, String, String, String)>(
        "SELECT id, word, translation, context, source_lang, target_lang, created_at FROM difficult_words WHERE word = ?"
    )
    .bind(&word)
    .fetch_one(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DifficultWord {
        id: row.0, word: row.1, translation: row.2, context: row.3,
        source_lang: row.4, target_lang: row.5, created_at: row.6,
    })
}

#[tauri::command]
pub async fn remove_word(word: String, state: tauri::State<'_, Arc<AppState>>) -> Result<(), String> {
    sqlx::query("DELETE FROM difficult_words WHERE word = ?")
        .bind(&word)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn list_words(state: tauri::State<'_, Arc<AppState>>) -> Result<Vec<DifficultWord>, String> {
    let rows = sqlx::query_as::<_, (i64, String, String, Option<String>, String, String, String)>(
        "SELECT id, word, translation, context, source_lang, target_lang, created_at FROM difficult_words ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows.into_iter().map(|r| DifficultWord {
        id: r.0, word: r.1, translation: r.2, context: r.3,
        source_lang: r.4, target_lang: r.5, created_at: r.6,
    }).collect())
}

#[tauri::command]
pub async fn update_word(
    word: String,
    translation: String,
    context: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    sqlx::query("UPDATE difficult_words SET translation = ?, context = ? WHERE word = ?")
        .bind(&translation)
        .bind(&context)
        .bind(&word)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
