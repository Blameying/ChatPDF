use crate::config::LlmConfig;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<MessagePayload>,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Value>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MessagePayload {
    pub role: String,
    pub content: MessageContent,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum MessageContent {
    Text(String),
    Null,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolCall {
    pub id: String,
    pub r#type: String,
    pub function: ToolCallFunction,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolCallFunction {
    pub name: String,
    pub arguments: String,
}

pub fn create_client() -> Client {
    Client::new()
}

pub fn build_request(config: &LlmConfig, messages: &[MessagePayload], tools: Option<Vec<Value>>) -> ChatRequest {
    ChatRequest {
        model: config.model.clone(),
        messages: messages.to_vec(),
        stream: true,
        tools,
    }
}

pub fn api_url(config: &LlmConfig) -> String {
    format!("{}/chat/completions", config.base_url.trim_end_matches('/'))
}
