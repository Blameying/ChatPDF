pub mod schema;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

fn default_theme() -> String { "light".into() }
fn default_language() -> String { "zh".into() }
fn default_hover_delay() -> u32 { 2000 }
fn default_false() -> bool { false }
fn default_provider() -> String { "mymemory".into() }
fn default_target_lang() -> String { "zh".into() }
fn default_source_lang() -> String { "en".into() }
fn default_base_url() -> String { "https://api.openai.com/v1".into() }
fn default_empty() -> String { String::new() }
fn default_model() -> String { "gpt-4o".into() }
fn default_max_tokens() -> u32 { 8000 }
fn default_true() -> bool { true }
fn default_tab() -> String { "\t".into() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default)]
    pub general: GeneralConfig,
    #[serde(default)]
    pub translation: TranslationConfig,
    #[serde(default)]
    pub llm: LlmConfig,
    #[serde(default)]
    pub keyboard: KeyboardConfig,
    #[serde(default)]
    pub export: ExportConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default = "default_hover_delay")]
    pub hover_delay_ms: u32,
    #[serde(default = "default_false")]
    pub zen_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationConfig {
    #[serde(default = "default_provider")]
    pub provider: String,
    #[serde(default = "default_target_lang")]
    pub target_lang: String,
    #[serde(default = "default_source_lang")]
    pub source_lang: String,
    #[serde(default)]
    pub deepl: DeepLConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DeepLConfig {
    #[serde(default = "default_empty")]
    pub api_key: String,
    #[serde(default = "default_deepl_url")]
    pub api_url: String,
}

fn default_deepl_url() -> String { "https://api-free.deepl.com/v2".into() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    #[serde(default = "default_base_url")]
    pub base_url: String,
    #[serde(default = "default_empty")]
    pub api_key: String,
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default = "default_max_tokens")]
    pub max_context_tokens: u32,
    #[serde(default = "default_empty")]
    pub system_prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardConfig {
    #[serde(default = "default_j")]
    pub scroll_down: String,
    #[serde(default = "default_k")]
    pub scroll_up: String,
    #[serde(default = "default_l")]
    pub next_page: String,
    #[serde(default = "default_h")]
    pub prev_page: String,
    #[serde(default = "default_slash")]
    pub search: String,
    #[serde(default = "default_f11")]
    pub zen_mode: String,
}

fn default_j() -> String { "j".into() }
fn default_k() -> String { "k".into() }
fn default_l() -> String { "l".into() }
fn default_h() -> String { "h".into() }
fn default_slash() -> String { "/".into() }
fn default_f11() -> String { "F11".into() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    #[serde(default = "default_true")]
    pub markdown_include_page_numbers: bool,
    #[serde(default = "default_tab")]
    pub anki_field_separator: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            general: GeneralConfig::default(),
            translation: TranslationConfig::default(),
            llm: LlmConfig::default(),
            keyboard: KeyboardConfig::default(),
            export: ExportConfig::default(),
        }
    }
}

impl Default for GeneralConfig {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            language: default_language(),
            hover_delay_ms: default_hover_delay(),
            zen_mode: default_false(),
        }
    }
}

impl Default for TranslationConfig {
    fn default() -> Self {
        Self {
            provider: default_provider(),
            target_lang: default_target_lang(),
            source_lang: default_source_lang(),
            deepl: DeepLConfig::default(),
        }
    }
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            base_url: default_base_url(),
            api_key: default_empty(),
            model: default_model(),
            max_context_tokens: default_max_tokens(),
            system_prompt: default_empty(),
        }
    }
}

impl Default for KeyboardConfig {
    fn default() -> Self {
        Self {
            scroll_down: default_j(),
            scroll_up: default_k(),
            next_page: default_l(),
            prev_page: default_h(),
            search: default_slash(),
            zen_mode: default_f11(),
        }
    }
}

impl Default for ExportConfig {
    fn default() -> Self {
        Self {
            markdown_include_page_numbers: default_true(),
            anki_field_separator: default_tab(),
        }
    }
}

impl AppConfig {
    fn config_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let home = dirs::home_dir().ok_or("No home directory")?;
        let config_dir = home.join(".chatpdf");
        std::fs::create_dir_all(&config_dir)?;
        Ok(config_dir.join("config.toml"))
    }

    pub fn load_or_default() -> Result<Self, Box<dyn std::error::Error>> {
        let path = Self::config_path()?;
        if path.exists() {
            let content = std::fs::read_to_string(&path)?;
            let config: AppConfig = toml::from_str(&content)?;
            Ok(config)
        } else {
            let config = AppConfig::default();
            config.save()?;
            Ok(config)
        }
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let path = Self::config_path()?;
        let content = toml::to_string_pretty(self)?;
        std::fs::write(&path, content)?;
        Ok(())
    }

    pub fn update_field(&mut self, section: &str, key: &str, value: &str) -> Result<(), String> {
        match (section, key) {
            ("general", "theme") => {
                if !["light", "dark", "sepia"].contains(&value) {
                    return Err("theme must be: light, dark, or sepia".into());
                }
                self.general.theme = value.into();
            }
            ("general", "language") => self.general.language = value.into(),
            ("general", "hover_delay_ms") => {
                self.general.hover_delay_ms = value.parse().map_err(|_| "must be a number")?;
            }
            ("general", "zen_mode") => {
                self.general.zen_mode = value.parse().map_err(|_| "must be true or false")?;
            }
            ("translation", "provider") => {
                if !["llm", "deepl", "mymemory"].contains(&value) {
                    return Err("provider must be: llm, deepl, or mymemory".into());
                }
                self.translation.provider = value.into();
            }
            ("translation", "target_lang") => self.translation.target_lang = value.into(),
            ("translation", "source_lang") => self.translation.source_lang = value.into(),
            ("translation.deepl", "api_key") => self.translation.deepl.api_key = value.into(),
            ("translation.deepl", "api_url") => self.translation.deepl.api_url = value.into(),
            ("llm", "base_url") => self.llm.base_url = value.into(),
            ("llm", "api_key") => self.llm.api_key = value.into(),
            ("llm", "model") => self.llm.model = value.into(),
            ("llm", "max_context_tokens") => {
                self.llm.max_context_tokens = value.parse().map_err(|_| "must be a number")?;
            }
            ("llm", "system_prompt") => self.llm.system_prompt = value.into(),
            ("keyboard", k) => {
                match k {
                    "scroll_down" => self.keyboard.scroll_down = value.into(),
                    "scroll_up" => self.keyboard.scroll_up = value.into(),
                    "next_page" => self.keyboard.next_page = value.into(),
                    "prev_page" => self.keyboard.prev_page = value.into(),
                    "search" => self.keyboard.search = value.into(),
                    "zen_mode" => self.keyboard.zen_mode = value.into(),
                    _ => return Err(format!("unknown keyboard key: {}", k)),
                }
            }
            ("export", "markdown_include_page_numbers") => {
                self.export.markdown_include_page_numbers = value.parse().map_err(|_| "must be true or false")?;
            }
            ("export", "anki_field_separator") => self.export.anki_field_separator = value.into(),
            _ => return Err(format!("unknown config: {}.{}", section, key)),
        }
        Ok(())
    }

    pub fn reset_section(&mut self, section: Option<&str>, key: Option<&str>) {
        let default = AppConfig::default();
        match (section, key) {
            (None, _) => *self = default,
            (Some("general"), None) => self.general = default.general,
            (Some("translation"), None) => self.translation = default.translation,
            (Some("llm"), None) => self.llm = default.llm,
            (Some("keyboard"), None) => self.keyboard = default.keyboard,
            (Some("export"), None) => self.export = default.export,
            (Some(s), Some(k)) => {
                let default_toml = toml::to_string(&default).unwrap_or_default();
                let default_config: AppConfig = toml::from_str(&default_toml).unwrap_or_default();
                let _ = self.update_field(s, k, &get_default_value(&default_config, s, k));
            }
            _ => {}
        }
    }
}

fn get_default_value(config: &AppConfig, section: &str, key: &str) -> String {
    match (section, key) {
        ("general", "theme") => config.general.theme.clone(),
        ("general", "language") => config.general.language.clone(),
        ("general", "hover_delay_ms") => config.general.hover_delay_ms.to_string(),
        ("general", "zen_mode") => config.general.zen_mode.to_string(),
        ("translation", "provider") => config.translation.provider.clone(),
        ("translation", "target_lang") => config.translation.target_lang.clone(),
        ("translation", "source_lang") => config.translation.source_lang.clone(),
        ("llm", "base_url") => config.llm.base_url.clone(),
        ("llm", "api_key") => config.llm.api_key.clone(),
        ("llm", "model") => config.llm.model.clone(),
        ("llm", "max_context_tokens") => config.llm.max_context_tokens.to_string(),
        ("llm", "system_prompt") => config.llm.system_prompt.clone(),
        _ => String::new(),
    }
}
