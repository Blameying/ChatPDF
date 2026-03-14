pub mod schema;

use sqlx::SqlitePool;

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(schema::CREATE_DOCUMENTS).execute(pool).await?;
    sqlx::query(schema::CREATE_DIFFICULT_WORDS).execute(pool).await?;
    sqlx::query(schema::CREATE_ANNOTATIONS).execute(pool).await?;
    sqlx::query(schema::CREATE_CHAT_HISTORY).execute(pool).await?;
    Ok(())
}
