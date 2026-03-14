use crate::state::AppState;
use crate::translation;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct TranslationResult {
    pub word: String,
    pub translation: String,
}

#[tauri::command]
pub async fn translate_word(
    word: String,
    context: Option<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<TranslationResult, String> {
    // Check cache first
    {
        let mut cache = state.translation_cache.lock().map_err(|e| e.to_string())?;
        if let Some(cached) = cache.get(&word) {
            return Ok(TranslationResult { word: word.clone(), translation: cached.clone() });
        }
    }

    let config = state.config.lock().map_err(|e| e.to_string())?.clone();

    let translation = translation::translate(
        &config, &word, context.as_deref(), &config.translation.target_lang.clone()
    ).await.map_err(|e| e.to_string())?;

    // Cache the result
    {
        let mut cache = state.translation_cache.lock().map_err(|e| e.to_string())?;
        cache.put(word.clone(), translation.clone());
    }

    Ok(TranslationResult { word, translation })
}

#[tauri::command]
pub async fn translate_batch(
    words: Vec<String>,
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Vec<TranslationResult>, String> {
    let mut results = Vec::new();
    let config = state.config.lock().map_err(|e| e.to_string())?.clone();

    for word in words {
        // Check cache
        let cached = {
            let mut cache = state.translation_cache.lock().map_err(|e| e.to_string())?;
            cache.get(&word).cloned()
        };

        if let Some(t) = cached {
            results.push(TranslationResult { word, translation: t });
        } else {
            let target_lang = config.translation.target_lang.clone();
            match translation::translate(&config, &word, None, &target_lang).await {
                Ok(t) => {
                    let mut cache = state.translation_cache.lock().map_err(|e| e.to_string())?;
                    cache.put(word.clone(), t.clone());
                    results.push(TranslationResult { word, translation: t });
                }
                Err(e) => {
                    results.push(TranslationResult { word, translation: format!("Error: {}", e) });
                }
            }
        }
    }

    Ok(results)
}
