use crate::config::LlmConfig;
use crate::commands::chat::ChatMessage;
use crate::llm::client::{self, MessagePayload, MessageContent, ToolCall, ToolCallFunction};
use crate::llm::tools;
use crate::state::AppState;
use futures::StreamExt;
use serde_json::Value;
use tauri::Emitter;

pub async fn stream_chat(
    config: &LlmConfig,
    messages: &[ChatMessage],
    document_context: Option<&str>,
    app: &tauri::AppHandle,
    state: &AppState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = client::create_client();

    let mut payloads: Vec<MessagePayload> = Vec::new();

    // System prompt
    let mut system = String::from(
        "You are an AI assistant helping the user read and understand PDF documents. \
         You can manage their word list, add annotations, and modify app settings. \
         Respond in the user's language when possible."
    );
    if let Some(ctx) = document_context {
        system.push_str("\n\nDocument context:\n");
        system.push_str(ctx);
    }
    if !config.system_prompt.is_empty() {
        system.push_str("\n\n");
        system.push_str(&config.system_prompt);
    }

    payloads.push(MessagePayload {
        role: "system".into(),
        content: MessageContent::Text(system),
        tool_calls: None,
        tool_call_id: None,
    });

    for msg in messages {
        payloads.push(MessagePayload {
            role: msg.role.clone(),
            content: MessageContent::Text(msg.content.clone()),
            tool_calls: None,
            tool_call_id: None,
        });
    }

    let tool_defs = tools::get_tool_definitions();

    // Allow up to 5 rounds of tool calls
    for _ in 0..5 {
        let request = client::build_request(config, &payloads, Some(tool_defs.clone()));
        let url = client::api_url(config);

        let response = client.post(&url)
            .header("Authorization", format!("Bearer {}", config.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            let _ = app.emit("chat:error", &error_text);
            return Err(error_text.into());
        }

        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut full_content = String::new();
        let mut tool_calls: Vec<ToolCall> = Vec::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(line_end) = buffer.find('\n') {
                let line = buffer[..line_end].trim().to_string();
                buffer = buffer[line_end + 1..].to_string();

                if !line.starts_with("data: ") { continue; }
                let data = &line[6..];
                if data == "[DONE]" { continue; }

                if let Ok(parsed) = serde_json::from_str::<Value>(data) {
                    if let Some(choices) = parsed.get("choices").and_then(|c| c.as_array()) {
                        if let Some(choice) = choices.first() {
                            let delta = &choice["delta"];

                            // Content delta
                            if let Some(content) = delta.get("content").and_then(|c| c.as_str()) {
                                full_content.push_str(content);
                                let _ = app.emit("chat:delta", content);
                            }

                            // Tool call deltas
                            if let Some(tc_arr) = delta.get("tool_calls").and_then(|t| t.as_array()) {
                                for tc in tc_arr {
                                    let index = tc.get("index").and_then(|i| i.as_u64()).unwrap_or(0) as usize;
                                    while tool_calls.len() <= index {
                                        tool_calls.push(ToolCall {
                                            id: String::new(),
                                            r#type: "function".into(),
                                            function: ToolCallFunction {
                                                name: String::new(),
                                                arguments: String::new(),
                                            },
                                        });
                                    }
                                    if let Some(id) = tc.get("id").and_then(|i| i.as_str()) {
                                        tool_calls[index].id = id.to_string();
                                    }
                                    if let Some(func) = tc.get("function") {
                                        if let Some(name) = func.get("name").and_then(|n| n.as_str()) {
                                            tool_calls[index].function.name = name.to_string();
                                        }
                                        if let Some(args) = func.get("arguments").and_then(|a| a.as_str()) {
                                            tool_calls[index].function.arguments.push_str(args);
                                        }
                                    }
                                }
                            }

                            // Check finish reason
                            if let Some(finish) = choice.get("finish_reason").and_then(|f| f.as_str()) {
                                if finish == "stop" {
                                    let _ = app.emit("chat:done", &full_content);
                                    return Ok(());
                                }
                            }
                        }
                    }
                }
            }
        }

        // If we have tool calls, execute them
        if !tool_calls.is_empty() {
            // Add assistant message with tool calls
            payloads.push(MessagePayload {
                role: "assistant".into(),
                content: if full_content.is_empty() { MessageContent::Null } else { MessageContent::Text(full_content.clone()) },
                tool_calls: Some(tool_calls.clone()),
                tool_call_id: None,
            });

            for tc in &tool_calls {
                let _ = app.emit("chat:tool_call", serde_json::json!({
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                }));

                let result = tools::execute_tool(&tc.function.name, &tc.function.arguments, state, app).await;

                let _ = app.emit("chat:tool_result", serde_json::json!({
                    "name": tc.function.name,
                    "result": result,
                }));

                payloads.push(MessagePayload {
                    role: "tool".into(),
                    content: MessageContent::Text(result),
                    tool_calls: None,
                    tool_call_id: Some(tc.id.clone()),
                });
            }

            full_content.clear();
            // Continue loop to get next response
        } else {
            let _ = app.emit("chat:done", &full_content);
            return Ok(());
        }
    }

    let _ = app.emit("chat:done", "");
    Ok(())
}
