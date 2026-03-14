use crate::state::AppState;
use serde_json::{json, Value};
use tauri::Emitter;

pub fn get_tool_definitions() -> Vec<Value> {
    vec![
        json!({
            "type": "function",
            "function": {
                "name": "add_difficult_word",
                "description": "Add a word to the user's difficult words list",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": { "type": "string", "description": "The word to add" },
                        "translation": { "type": "string", "description": "Translation of the word" },
                        "context": { "type": "string", "description": "Example sentence or context" }
                    },
                    "required": ["word", "translation"]
                }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "remove_difficult_word",
                "description": "Remove a word from the difficult words list",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": { "type": "string", "description": "The word to remove" }
                    },
                    "required": ["word"]
                }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "list_difficult_words",
                "description": "List all difficult words",
                "parameters": { "type": "object", "properties": {} }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "add_annotation",
                "description": "Add a highlight or note annotation to the document",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "page": { "type": "integer", "description": "Page number" },
                        "selected_text": { "type": "string", "description": "The selected text to annotate" },
                        "note": { "type": "string", "description": "Note or comment" },
                        "color": { "type": "string", "description": "Highlight color (hex)" }
                    },
                    "required": ["page", "selected_text"]
                }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "get_config",
                "description": "Get the current application configuration (TOML format)",
                "parameters": { "type": "object", "properties": {} }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "get_config_schema",
                "description": "Get the configuration schema with field descriptions, types, and allowed values",
                "parameters": { "type": "object", "properties": {} }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "update_config",
                "description": "Update a configuration setting",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "section": { "type": "string", "description": "Config section (e.g., 'general', 'llm', 'translation')" },
                        "key": { "type": "string", "description": "Config key within the section" },
                        "value": { "type": "string", "description": "New value" }
                    },
                    "required": ["section", "key", "value"]
                }
            }
        }),
        json!({
            "type": "function",
            "function": {
                "name": "reset_config",
                "description": "Reset configuration to defaults. Can reset all, a section, or a single key.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "section": { "type": "string", "description": "Section to reset (omit for all)" },
                        "key": { "type": "string", "description": "Key to reset (omit for whole section)" }
                    }
                }
            }
        }),
    ]
}

pub async fn execute_tool(
    name: &str,
    arguments: &str,
    state: &AppState,
    app: &tauri::AppHandle,
) -> String {
    let args: Value = serde_json::from_str(arguments).unwrap_or(json!({}));

    match name {
        "add_difficult_word" => {
            let word = args["word"].as_str().unwrap_or("").to_string();
            let translation = args["translation"].as_str().unwrap_or("").to_string();
            let context = args["context"].as_str().map(|s| s.to_string());

            let (source_lang, target_lang) = {
                let config = state.config.lock().unwrap();
                (config.translation.source_lang.clone(), config.translation.target_lang.clone())
            };

            match sqlx::query(
                "INSERT OR REPLACE INTO difficult_words (word, translation, context, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(&word)
            .bind(&translation)
            .bind(&context)
            .bind(&source_lang)
            .bind(&target_lang)
            .execute(&state.db)
            .await {
                Ok(_) => {
                    let _ = app.emit("words:changed", ());
                    format!("Added '{}' to difficult words list", word)
                }
                Err(e) => format!("Error: {}", e),
            }
        }
        "remove_difficult_word" => {
            let word = args["word"].as_str().unwrap_or("");
            match sqlx::query("DELETE FROM difficult_words WHERE word = ?")
                .bind(word)
                .execute(&state.db)
                .await {
                Ok(_) => {
                    let _ = app.emit("words:changed", ());
                    format!("Removed '{}' from difficult words list", word)
                }
                Err(e) => format!("Error: {}", e),
            }
        }
        "list_difficult_words" => {
            match sqlx::query_as::<_, (String, String)>(
                "SELECT word, translation FROM difficult_words ORDER BY created_at DESC"
            )
            .fetch_all(&state.db)
            .await {
                Ok(rows) => {
                    if rows.is_empty() {
                        "No difficult words saved yet.".to_string()
                    } else {
                        rows.iter()
                            .map(|(w, t)| format!("- {} : {}", w, t))
                            .collect::<Vec<_>>()
                            .join("\n")
                    }
                }
                Err(e) => format!("Error: {}", e),
            }
        }
        "add_annotation" => {
            let page = args["page"].as_i64().unwrap_or(1);
            let text = args["selected_text"].as_str().unwrap_or("");
            let note = args["note"].as_str().map(|s| s.to_string());
            let color = args["color"].as_str().unwrap_or("#FFEB3B");

            let position_data = json!({"text": text}).to_string();

            match sqlx::query(
                "INSERT INTO annotations (document_hash, page, type, content, color, position_data) VALUES ('current', ?, 'highlight', ?, ?, ?)"
            )
            .bind(page)
            .bind(&note)
            .bind(color)
            .bind(&position_data)
            .execute(&state.db)
            .await {
                Ok(_) => {
                    let _ = app.emit("annotations:changed", ());
                    format!("Added annotation on page {}", page)
                }
                Err(e) => format!("Error: {}", e),
            }
        }
        "get_config" => {
            let config = state.config.lock().unwrap();
            toml::to_string_pretty(&*config).unwrap_or_else(|e| format!("Error: {}", e))
        }
        "get_config_schema" => {
            crate::config::schema::get_config_schema().to_string()
        }
        "update_config" => {
            let section = args["section"].as_str().unwrap_or("");
            let key = args["key"].as_str().unwrap_or("");
            let value = args["value"].as_str().unwrap_or("");

            let mut config = state.config.lock().unwrap();
            match config.update_field(section, key, value) {
                Ok(()) => {
                    if let Err(e) = config.save() {
                        return format!("Updated in memory but failed to save: {}", e);
                    }
                    let config_json = serde_json::to_string(&*config).unwrap_or_default();
                    let _ = app.emit("config:changed", &config_json);
                    format!("Updated {}.{} = {}", section, key, value)
                }
                Err(e) => format!("Error: {}", e),
            }
        }
        "reset_config" => {
            let section = args["section"].as_str();
            let key = args["key"].as_str();

            let mut config = state.config.lock().unwrap();
            config.reset_section(section, key);
            if let Err(e) = config.save() {
                return format!("Reset but failed to save: {}", e);
            }
            let config_json = serde_json::to_string(&*config).unwrap_or_default();
            let _ = app.emit("config:changed", &config_json);
            "Configuration reset to defaults".to_string()
        }
        _ => format!("Unknown tool: {}", name),
    }
}
