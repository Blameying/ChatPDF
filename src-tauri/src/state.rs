use sqlx::SqlitePool;
use std::sync::Mutex;
use lru::LruCache;
use tauri::Manager;

use crate::config::AppConfig;

pub struct AppState {
    pub db: SqlitePool,
    pub config: Mutex<AppConfig>,
    pub translation_cache: Mutex<LruCache<String, String>>,
}

impl AppState {
    pub async fn new(app_handle: &tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let app_dir = app_handle.path().app_data_dir()?;
        std::fs::create_dir_all(&app_dir)?;

        let db_path = app_dir.join("chatpdf.db");
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

        let db = SqlitePool::connect(&db_url).await?;
        crate::db::run_migrations(&db).await?;

        let config = AppConfig::load_or_default()?;

        Ok(Self {
            db,
            config: Mutex::new(config),
            translation_cache: Mutex::new(LruCache::new(1000)),
        })
    }
}
