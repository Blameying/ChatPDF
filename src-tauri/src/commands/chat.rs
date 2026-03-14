use crate::state::AppState;
use crate::llm;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::Emitter;

#[derive(Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub status: String,
}

#[tauri::command]
pub async fn send_message(
    messages: Vec<ChatMessage>,
    document_context: Option<String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<ChatResponse, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let llm_config = config.llm.clone();
    drop(config);

    if llm_config.api_key.is_empty() {
        return Err("LLM API key not configured. Set it in Settings or ask me to update the config.".into());
    }

    let state_arc = state.inner().clone();

    tokio::spawn(async move {
        let result = llm::streaming::stream_chat(
            &llm_config,
            &messages,
            document_context.as_deref(),
            &app,
            &state_arc,
        ).await;

        if let Err(e) = result {
            let _ = app.emit("chat:error", e.to_string());
        }
    });

    Ok(ChatResponse { status: "streaming".into() })
}

#[tauri::command]
pub async fn get_chat_history(
    document_hash: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Option<String>, String> {
    let row = sqlx::query_as::<_, (String,)>(
        "SELECT messages FROM chat_history WHERE document_hash = ? ORDER BY created_at DESC LIMIT 1"
    )
    .bind(&document_hash)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row.map(|r| r.0))
}

#[tauri::command]
pub async fn save_chat_history(
    document_hash: String,
    messages: String,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<(), String> {
    // Delete old history for this document, then insert new
    sqlx::query("DELETE FROM chat_history WHERE document_hash = ?")
        .bind(&document_hash)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO chat_history (document_hash, messages) VALUES (?, ?)")
        .bind(&document_hash)
        .bind(&messages)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
