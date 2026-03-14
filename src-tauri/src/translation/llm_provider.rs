use crate::config::LlmConfig;
use reqwest::Client;
use serde_json::json;

pub async fn translate(
    config: &LlmConfig,
    word: &str,
    context: Option<&str>,
    target_lang: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    if config.api_key.is_empty() {
        return Err("LLM API key not configured".into());
    }

    let lang_name = match target_lang {
        "zh" => "Chinese (中文)",
        "ja" => "Japanese (日本語)",
        "ko" => "Korean (한국어)",
        "fr" => "French",
        "de" => "German",
        "es" => "Spanish",
        "pt" => "Portuguese",
        "ru" => "Russian",
        "ar" => "Arabic",
        other => other,
    };

    let mut prompt = format!(
        "Translate the English word/phrase '{}' into {}. \
         Provide a concise translation. Return ONLY the translation, nothing else. \
         Do NOT return the original English word.",
        word, lang_name
    );
    if let Some(ctx) = context {
        prompt.push_str(&format!(" Context: \"{}\"", ctx));
    }

    let client = Client::new();
    let url = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));

    let response = client.post(&url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": config.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
            "temperature": 0.1,
            "stream": false,
        }))
        .send()
        .await?;

    let status = response.status();
    let body_text = response.text().await?;

    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status, body_text).into());
    }

    let body: serde_json::Value = serde_json::from_str(&body_text)
        .map_err(|e| format!("JSON parse error: {} | body: {}", e, &body_text[..body_text.len().min(200)]))?;

    let translation = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Unexpected response shape: {}", &body_text[..body_text.len().min(200)]))?
        .trim()
        .to_string();

    Ok(translation)
}
