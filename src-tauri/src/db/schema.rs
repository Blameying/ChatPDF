pub const CREATE_DOCUMENTS: &str = r#"
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    hash TEXT NOT NULL UNIQUE,
    title TEXT,
    total_pages INTEGER,
    last_page INTEGER DEFAULT 1,
    scroll_y REAL DEFAULT 0.0,
    zoom_level REAL DEFAULT 1.0,
    last_opened TEXT DEFAULT (datetime('now'))
)
"#;

pub const CREATE_DIFFICULT_WORDS: &str = r#"
CREATE TABLE IF NOT EXISTS difficult_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE COLLATE NOCASE,
    translation TEXT NOT NULL,
    context TEXT,
    source_lang TEXT DEFAULT 'en',
    target_lang TEXT DEFAULT 'zh',
    created_at TEXT DEFAULT (datetime('now'))
)
"#;

pub const CREATE_ANNOTATIONS: &str = r#"
CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_hash TEXT NOT NULL,
    page INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('highlight','note','bookmark')),
    content TEXT,
    color TEXT DEFAULT '#FFEB3B',
    position_data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
)
"#;

pub const CREATE_CHAT_HISTORY: &str = r#"
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_hash TEXT NOT NULL,
    messages TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
)
"#;
