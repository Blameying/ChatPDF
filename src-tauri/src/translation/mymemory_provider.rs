use reqwest::Client;

pub async fn translate(
    word: &str,
    target_lang: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()?;

    let langpair = format!("en|{}", target_lang);
    let response = client
        .get("https://api.mymemory.translated.net/get")
        .query(&[("q", word), ("langpair", &langpair)])
        .send()
        .await?;

    let body: serde_json::Value = response.json().await?;

    // responseStatus 200 = OK, 429 = quota exceeded
    let status = body["responseStatus"].as_u64().unwrap_or(0);
    if status == 429 {
        return Err("MyMemory daily quota exceeded (1000 req/day)".into());
    }

    let translated = body["responseData"]["translatedText"]
        .as_str()
        .ok_or("Unexpected MyMemory response shape")?
        .trim()
        .to_string();

    if translated.is_empty() || translated.eq_ignore_ascii_case(word) {
        return Err(format!("No translation found for '{}'", word).into());
    }

    Ok(translated)
}
