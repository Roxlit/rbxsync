//! Native iMessage integration for rbxsync
//!
//! Monitors ~/Library/Messages/chat.db for incoming messages,
//! processes them with Claude + rbxsync-mcp, and replies via AppleScript.

use anyhow::{Context, Result};
use reqwest::Client;
use rusqlite::{Connection, OpenFlags};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use std::process::Command;

/// Message from the chat database
#[derive(Debug, Clone)]
pub struct IncomingMessage {
    pub rowid: i64,
    pub text: String,
    pub sender: String,
    pub date: i64,
}

/// iMessage monitor that watches for new messages
pub struct IMessageMonitor {
    db_path: PathBuf,
    processed_ids: HashSet<i64>,
    last_rowid: i64,
    http_client: Client,
    anthropic_api_key: String,
    whitelist: Option<Vec<String>>,
}

impl IMessageMonitor {
    pub fn new(anthropic_api_key: String, whitelist: Option<Vec<String>>) -> Result<Self> {
        let home = std::env::var("HOME").context("HOME not set")?;
        let db_path = PathBuf::from(home).join("Library/Messages/chat.db");

        if !db_path.exists() {
            anyhow::bail!(
                "Messages database not found at {:?}. Make sure iMessage is set up on this Mac.",
                db_path
            );
        }

        Ok(Self {
            db_path,
            processed_ids: HashSet::new(),
            last_rowid: 0,
            http_client: Client::new(),
            anthropic_api_key,
            whitelist,
        })
    }

    /// Initialize by getting the current max rowid (so we don't process old messages)
    pub fn init(&mut self) -> Result<()> {
        let conn = self.open_db()?;

        let max_rowid: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(ROWID), 0) FROM message",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        self.last_rowid = max_rowid;
        println!("Starting from message ID: {}", self.last_rowid);

        Ok(())
    }

    fn open_db(&self) -> Result<Connection> {
        // Open read-only to avoid locking issues with Messages.app
        Connection::open_with_flags(&self.db_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
            .context("Failed to open Messages database. You may need to grant Full Disk Access to your terminal in System Preferences > Privacy & Security.")
    }

    /// Poll for new messages
    pub fn poll(&mut self) -> Result<Vec<IncomingMessage>> {
        let conn = self.open_db()?;

        let mut stmt = conn.prepare(
            r#"
            SELECT
                m.ROWID,
                m.text,
                COALESCE(h.id, '') as sender,
                m.date
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID > ?
              AND m.is_from_me = 0
              AND m.text IS NOT NULL
              AND m.text != ''
            ORDER BY m.ROWID ASC
            LIMIT 10
            "#,
        )?;

        let messages: Vec<IncomingMessage> = stmt
            .query_map([self.last_rowid], |row| {
                Ok(IncomingMessage {
                    rowid: row.get(0)?,
                    text: row.get(1)?,
                    sender: row.get(2)?,
                    date: row.get(3)?,
                })
            })?
            .filter_map(|r| r.ok())
            .filter(|m| {
                // Skip if already processed
                if self.processed_ids.contains(&m.rowid) {
                    return false;
                }
                // Check whitelist if set
                if let Some(ref whitelist) = self.whitelist {
                    if !whitelist.iter().any(|w| m.sender.contains(w)) {
                        return false;
                    }
                }
                true
            })
            .collect();

        // Update tracking
        for msg in &messages {
            self.processed_ids.insert(msg.rowid);
            if msg.rowid > self.last_rowid {
                self.last_rowid = msg.rowid;
            }
        }

        Ok(messages)
    }

    /// Process a message with Claude + rbxsync-mcp
    pub async fn process_message(&self, message: &IncomingMessage) -> Result<String> {
        println!("[iMessage] From {}: {}", message.sender, message.text);

        // Call rbxsync-mcp via the local server
        let response = self.call_agent(&message.text).await?;

        println!("[iMessage] Response: {}", response);
        Ok(response)
    }

    /// Call the Claude agent with rbxsync tools
    async fn call_agent(&self, user_message: &str) -> Result<String> {
        // Use Anthropic API directly with tool use
        let tools = serde_json::json!([
            {
                "name": "run_code",
                "description": "Execute Luau code in Roblox Studio. Use print() to return information.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Luau code to execute"
                        }
                    },
                    "required": ["code"]
                }
            },
            {
                "name": "insert_model",
                "description": "Insert a model from the Roblox marketplace",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query for the model"
                        }
                    },
                    "required": ["query"]
                }
            }
        ]);

        let system_prompt = r#"You are a Roblox game development assistant that controls Roblox Studio via iMessage.
You have tools to run Luau code and insert models. Keep responses SHORT since they go via text message.
When users ask to modify the game, write Luau code to do it. Use print() to return info."#;

        let mut messages = vec![serde_json::json!({
            "role": "user",
            "content": user_message
        })];

        // Initial API call
        let mut response = self.call_anthropic(&messages, &tools, system_prompt).await?;

        // Agentic loop - process tool calls
        while response.get("stop_reason").and_then(|s| s.as_str()) == Some("tool_use") {
            let content = response.get("content").and_then(|c| c.as_array()).cloned().unwrap_or_default();

            messages.push(serde_json::json!({
                "role": "assistant",
                "content": content
            }));

            let mut tool_results = Vec::new();

            for block in &content {
                if block.get("type").and_then(|t| t.as_str()) == Some("tool_use") {
                    let tool_name = block.get("name").and_then(|n| n.as_str()).unwrap_or("");
                    let tool_id = block.get("id").and_then(|i| i.as_str()).unwrap_or("");
                    let input = block.get("input").cloned().unwrap_or_default();

                    let result = self.execute_tool(tool_name, &input).await?;

                    tool_results.push(serde_json::json!({
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": result
                    }));
                }
            }

            messages.push(serde_json::json!({
                "role": "user",
                "content": tool_results
            }));

            response = self.call_anthropic(&messages, &tools, system_prompt).await?;
        }

        // Extract final text response
        let content = response.get("content").and_then(|c| c.as_array()).cloned().unwrap_or_default();
        let text: String = content
            .iter()
            .filter_map(|block| {
                if block.get("type").and_then(|t| t.as_str()) == Some("text") {
                    block.get("text").and_then(|t| t.as_str()).map(String::from)
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        Ok(if text.is_empty() { "Done!".to_string() } else { text })
    }

    async fn call_anthropic(
        &self,
        messages: &[serde_json::Value],
        tools: &serde_json::Value,
        system: &str,
    ) -> Result<serde_json::Value> {
        let response = self
            .http_client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.anthropic_api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&serde_json::json!({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "system": system,
                "tools": tools,
                "messages": messages
            }))
            .send()
            .await
            .context("Failed to call Anthropic API")?;

        let status = response.status();
        let body: serde_json::Value = response.json().await?;

        if !status.is_success() {
            let error = body.get("error").and_then(|e| e.get("message")).and_then(|m| m.as_str()).unwrap_or("Unknown error");
            anyhow::bail!("Anthropic API error: {}", error);
        }

        Ok(body)
    }

    async fn execute_tool(&self, name: &str, input: &serde_json::Value) -> Result<String> {
        match name {
            "run_code" => {
                let code = input.get("code").and_then(|c| c.as_str()).unwrap_or("");
                self.run_code(code).await
            }
            "insert_model" => {
                let query = input.get("query").and_then(|q| q.as_str()).unwrap_or("");
                self.insert_model(query).await
            }
            _ => Ok(format!("Unknown tool: {}", name)),
        }
    }

    async fn run_code(&self, code: &str) -> Result<String> {
        let response = self
            .http_client
            .post("http://127.0.0.1:44755/run")
            .json(&serde_json::json!({ "code": code }))
            .send()
            .await
            .context("Failed to call rbxsync server")?;

        let result: serde_json::Value = response.json().await?;

        if result.get("success").and_then(|s| s.as_bool()).unwrap_or(false) {
            Ok(result.get("output").and_then(|o| o.as_str()).unwrap_or("").to_string())
        } else {
            let error = result.get("error").and_then(|e| e.as_str()).unwrap_or("Unknown error");
            Ok(format!("Error: {}", error))
        }
    }

    async fn insert_model(&self, query: &str) -> Result<String> {
        let response = self
            .http_client
            .post("http://127.0.0.1:44755/insert-model")
            .json(&serde_json::json!({ "query": query }))
            .send()
            .await
            .context("Failed to call rbxsync server")?;

        let result: serde_json::Value = response.json().await?;

        if result.get("success").and_then(|s| s.as_bool()).unwrap_or(false) {
            let name = result.get("model_name").and_then(|n| n.as_str()).unwrap_or("model");
            Ok(format!("Inserted: {}", name))
        } else {
            let error = result.get("error").and_then(|e| e.as_str()).unwrap_or("Unknown error");
            Ok(format!("Error: {}", error))
        }
    }

    /// Send a reply via AppleScript
    pub fn send_reply(&self, to: &str, message: &str) -> Result<()> {
        // Escape the message for AppleScript
        let escaped_message = message
            .replace('\\', "\\\\")
            .replace('"', "\\\"")
            .replace('\n', "\\n");

        let script = format!(
            r#"
            tell application "Messages"
                set targetService to 1st account whose service type = iMessage
                set targetBuddy to participant "{}" of targetService
                send "{}" to targetBuddy
            end tell
            "#,
            to, escaped_message
        );

        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .context("Failed to run AppleScript")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Try alternate method
            self.send_reply_alternate(to, message)?;
        }

        Ok(())
    }

    fn send_reply_alternate(&self, to: &str, message: &str) -> Result<()> {
        let escaped_message = message
            .replace('\\', "\\\\")
            .replace('"', "\\\"");

        let script = format!(
            r#"
            tell application "Messages"
                send "{}" to buddy "{}" of (service 1 whose service type is iMessage)
            end tell
            "#,
            escaped_message, to
        );

        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .context("Failed to run AppleScript")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("AppleScript error: {}", stderr);
        }

        Ok(())
    }
}

/// Run the iMessage monitor loop
pub async fn run_imessage_monitor(
    api_key: String,
    whitelist: Option<Vec<String>>,
) -> Result<()> {
    println!("Starting iMessage monitor...");
    println!();

    let mut monitor = IMessageMonitor::new(api_key, whitelist)?;
    monitor.init()?;

    println!("Listening for iMessages. Text this Mac to control Roblox Studio!");
    println!("Press Ctrl+C to stop.");
    println!();

    loop {
        match monitor.poll() {
            Ok(messages) => {
                for msg in messages {
                    match monitor.process_message(&msg).await {
                        Ok(response) => {
                            if let Err(e) = monitor.send_reply(&msg.sender, &response) {
                                eprintln!("Failed to send reply: {}", e);
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to process message: {}", e);
                            let _ = monitor.send_reply(&msg.sender, &format!("Error: {}", e));
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("Poll error: {}", e);
            }
        }

        // Poll every 2 seconds
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    }
}
