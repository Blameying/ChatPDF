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

    let mut prompt = format!(
        "Translate the word '{}' to {}. Return ONLY the translation, nothing else.",
        word, target_lang
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
            "max_tokens": 100,
            "temperature": 0.1,
        }))
        .send()
        .await?;

    let body: serde_json::Value = response.json().await?;
    let translation = body["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("Translation failed")
        .trim()
        .to_string();

    Ok(translation)
}
