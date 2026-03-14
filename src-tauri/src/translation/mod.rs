pub mod llm_provider;
pub mod deepl_provider;
pub mod mymemory_provider;

use crate::config::AppConfig;

pub async fn translate(
    config: &AppConfig,
    word: &str,
    context: Option<&str>,
    target_lang: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    match config.translation.provider.as_str() {
        "deepl" => deepl_provider::translate(&config.translation.deepl, word, target_lang).await,
        "llm" => llm_provider::translate(&config.llm, word, context, target_lang).await,
        _ => mymemory_provider::translate(word, target_lang).await,
    }
}
