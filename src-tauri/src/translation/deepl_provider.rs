use crate::config::DeepLConfig;
use reqwest::Client;
use serde_json::Value;

pub async fn translate(
    config: &DeepLConfig,
    text: &str,
    target_lang: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    if config.api_key.is_empty() {
        return Err("DeepL API key not configured".into());
    }

    let client = Client::new();
    let url = format!("{}/translate", config.api_url.trim_end_matches('/'));

    // DeepL uses uppercase language codes
    let target = target_lang.to_uppercase();
    // Map common codes
    let target = match target.as_str() {
        "ZH" => "ZH",
        _ => &target,
    };

    let response = client.post(&url)
        .header("Authorization", format!("DeepL-Auth-Key {}", config.api_key))
        .form(&[
            ("text", text),
            ("target_lang", target),
        ])
        .send()
        .await?;

    let body: Value = response.json().await?;
    let translation = body["translations"][0]["text"]
        .as_str()
        .unwrap_or("Translation failed")
        .to_string();

    Ok(translation)
}
