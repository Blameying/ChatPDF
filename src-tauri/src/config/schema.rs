pub fn get_config_schema() -> &'static str {
    r#"# ChatPDF Configuration Schema

## [general]
- theme: string = "light" | "dark" | "sepia" — UI theme
- language: string = "zh" — UI language code
- hover_delay_ms: integer = 2000 — hover translation delay in milliseconds
- zen_mode: boolean = false — hide all UI for pure reading

## [translation]
- provider: string = "llm" | "deepl" | "google" — translation service
- target_lang: string = "zh" — target language code
- source_lang: string = "en" — source language code (or "auto")

## [translation.deepl]
- api_key: string = "" — DeepL API key
- api_url: string = "https://api-free.deepl.com/v2" — DeepL API endpoint

## [llm]
- base_url: string = "https://api.openai.com/v1" — OpenAI-compatible API base URL
- api_key: string = "" — API key
- model: string = "gpt-4o" — model name
- max_context_tokens: integer = 8000 — max tokens for document context
- system_prompt: string = "" — custom system prompt (appended)

## [keyboard]
- scroll_down: string = "j"
- scroll_up: string = "k"
- next_page: string = "l"
- prev_page: string = "h"
- search: string = "/"
- zen_mode: string = "F11"

## [export]
- markdown_include_page_numbers: boolean = true
- anki_field_separator: string = "\t"
"#
}
