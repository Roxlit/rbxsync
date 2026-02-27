use rmcp::{
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{ErrorData as McpError, *},
    schemars, tool, tool_handler, tool_router, ServerHandler, ServiceExt,
    transport::stdio,
};
use serde::Deserialize;
use std::borrow::Cow;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod tools;
use tools::RbxSyncClient;

/// RbxSync MCP Server - provides tools for extracting and syncing Roblox games
#[derive(Debug, Clone)]
pub struct RbxSyncServer {
    client: RbxSyncClient,
    tool_router: ToolRouter<RbxSyncServer>,
}

/// Parameters for extract_game tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ExtractParams {
    /// The directory where the project files will be written
    #[schemars(description = "The directory where project files will be written")]
    pub project_dir: String,
    /// Optional list of services to extract (e.g., ["Workspace", "ServerScriptService"])
    #[schemars(description = "Optional services to extract")]
    pub services: Option<Vec<String>>,
    /// Whether to include terrain data (voxel chunks). Defaults to true.
    #[schemars(description = "Include terrain data (default: true)")]
    #[serde(default = "default_include_terrain")]
    pub include_terrain: bool,
}

fn default_include_terrain() -> bool {
    true
}

/// Parameters for sync_to_studio tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct SyncParams {
    /// The directory containing the project files to sync
    #[schemars(description = "Directory containing project files to sync")]
    pub project_dir: String,

    /// If true, delete instances in Studio that don't exist in local files
    #[schemars(description = "Delete orphaned instances in Studio (optional, default: false)")]
    pub delete: Option<bool>,
}

/// Parameters for git_commit tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GitCommitParams {
    /// The project directory
    #[schemars(description = "The project directory")]
    pub project_dir: String,
    /// The commit message
    #[schemars(description = "The commit message")]
    pub message: String,
    /// Optional list of specific files to commit
    #[schemars(description = "Optional files to commit")]
    pub files: Option<Vec<String>>,
}

/// Parameters for git_status tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GitStatusParams {
    /// The project directory
    #[schemars(description = "The project directory")]
    pub project_dir: String,
}

/// Parameters for run_code tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct RunCodeParams {
    /// Luau code to execute in Roblox Studio
    #[schemars(description = "Luau code to execute in Studio")]
    pub code: String,
}

/// Parameters for run_test tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct RunTestParams {
    /// How long to run the test in seconds (default: 5)
    #[schemars(description = "Test duration in seconds (default: 5)")]
    pub duration: Option<u32>,
    /// Test mode: "Play" for solo play, "Run" for server simulation (default: "Play")
    #[schemars(description = "Test mode: Play or Run (default: Play)")]
    pub mode: Option<String>,
    /// If true, start the test and return immediately without waiting for completion.
    /// Use this for interactive bot testing with bot_observe/bot_move/bot_action.
    #[schemars(description = "Run in background mode - start test and return immediately (default: false)")]
    pub background: Option<bool>,
}

/// Parameters for insert_model tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct InsertModelParams {
    /// Roblox asset ID to insert
    #[schemars(description = "Roblox asset ID (number) of the model to insert")]
    #[serde(rename = "assetId")]
    pub asset_id: u64,
    /// Parent path to insert the model into (e.g., "Workspace", "ServerStorage/Items")
    #[schemars(description = "Parent path to insert into (default: Workspace)")]
    pub parent: Option<String>,
}

// ============================================================================
// Harness Parameters (Multi-session AI game development tracking)
// ============================================================================

/// Parameters for harness_init tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct HarnessInitParams {
    /// The project directory where harness will be initialized
    #[schemars(description = "Project directory path")]
    pub project_dir: String,
    /// Name of the game being developed
    #[schemars(description = "Game name")]
    pub game_name: String,
    /// Optional game description
    #[schemars(description = "Optional game description")]
    pub description: Option<String>,
    /// Optional game genre (e.g., "Obby", "Tycoon", "Simulator")
    #[schemars(description = "Optional game genre")]
    pub genre: Option<String>,
}

/// Parameters for harness_session_start tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct HarnessSessionStartParams {
    /// The project directory
    #[schemars(description = "Project directory path")]
    pub project_dir: String,
    /// Optional initial goals for this development session
    #[schemars(description = "Initial goals/focus for this session")]
    pub initial_goals: Option<String>,
}

/// Parameters for harness_session_end tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct HarnessSessionEndParams {
    /// The project directory
    #[schemars(description = "Project directory path")]
    pub project_dir: String,
    /// Session ID to end
    #[schemars(description = "Session ID to end")]
    pub session_id: String,
    /// Summary of what was accomplished
    #[schemars(description = "Summary of accomplishments")]
    pub summary: Option<String>,
    /// Notes for the next session/developer
    #[schemars(description = "Handoff notes for future sessions")]
    pub handoff_notes: Option<Vec<String>>,
}

/// Parameters for harness_feature_update tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct HarnessFeatureUpdateParams {
    /// The project directory
    #[schemars(description = "Project directory path")]
    pub project_dir: String,
    /// Feature ID (if updating existing feature)
    #[schemars(description = "Feature ID for updates (omit for new features)")]
    pub feature_id: Option<String>,
    /// Feature name (required for new features)
    #[schemars(description = "Feature name (required for new features)")]
    pub name: Option<String>,
    /// Feature description
    #[schemars(description = "Feature description")]
    pub description: Option<String>,
    /// Feature status: planned, in_progress, completed, blocked, cancelled
    #[schemars(description = "Status: planned, in_progress, completed, blocked, cancelled")]
    pub status: Option<String>,
    /// Priority: low, medium, high, critical
    #[schemars(description = "Priority: low, medium, high, critical")]
    pub priority: Option<String>,
    /// Tags to categorize the feature
    #[schemars(description = "Tags for categorization")]
    pub tags: Option<Vec<String>>,
    /// Note to add to the feature
    #[schemars(description = "Note to add")]
    pub add_note: Option<String>,
    /// Session ID working on this feature
    #[schemars(description = "Session ID working on feature")]
    pub session_id: Option<String>,
}

/// Parameters for harness_status tool
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct HarnessStatusParams {
    /// The project directory
    #[schemars(description = "Project directory path")]
    pub project_dir: String,
}

fn mcp_error(msg: impl Into<String>) -> McpError {
    McpError {
        code: ErrorCode(-32603),
        message: Cow::from(msg.into()),
        data: None,
    }
}

#[tool_router]
impl RbxSyncServer {
    pub fn new() -> Self {
        Self {
            client: RbxSyncClient::new(44755),
            tool_router: Self::tool_router(),
        }
    }

    /// Extract a Roblox game from Studio to git-friendly files on disk.
    #[tool(description = "Extract a Roblox game from Studio to git-friendly files")]
    async fn extract_game(
        &self,
        Parameters(params): Parameters<ExtractParams>,
    ) -> Result<CallToolResult, McpError> {
        // Check connection
        let health = self.client.check_health().await.map_err(|e| mcp_error(e.to_string()))?;

        if !health {
            return Ok(CallToolResult::success(vec![Content::text(
                "Error: Not connected to RbxSync server. Make sure 'rbxsync serve' is running and Studio plugin is active.",
            )]));
        }

        // Start extraction
        let session = self.client
            .start_extraction(&params.project_dir, params.services.as_deref(), params.include_terrain)
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        // Poll for completion
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            let status = self.client.get_extraction_status().await.map_err(|e| mcp_error(e.to_string()))?;

            if status.complete {
                break;
            }
            if let Some(err) = &status.error {
                return Ok(CallToolResult::success(vec![Content::text(format!(
                    "Extraction error: {}",
                    err
                ))]));
            }
        }

        // Finalize extraction
        let result = self.client
            .finalize_extraction(&session.session_id, &params.project_dir)
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        Ok(CallToolResult::success(vec![Content::text(format!(
            "Successfully extracted game to {}. {} files written.",
            params.project_dir, result.files_written
        ))]))
    }

    /// Sync local file changes back to Roblox Studio.
    #[tool(description = "Sync local file changes back to Roblox Studio")]
    async fn sync_to_studio(
        &self,
        Parameters(params): Parameters<SyncParams>,
    ) -> Result<CallToolResult, McpError> {
        // Use incremental sync - only reads files modified since last sync
        let incremental = self.client.read_incremental(&params.project_dir).await.map_err(|e| mcp_error(e.to_string()))?;

        // Build sync operations in the format expected by the plugin
        let mut operations = tools::build_sync_operations(incremental.instances);

        // If delete flag is set, add delete operations for orphaned instances
        let delete_count = if params.delete.unwrap_or(false) {
            let diff = self.client.get_diff(&params.project_dir).await.map_err(|e| mcp_error(e.to_string()))?;
            let removed_count = diff.removed.len();
            for entry in diff.removed {
                operations.push(serde_json::json!({
                    "type": "delete",
                    "path": entry.path
                }));
            }
            removed_count
        } else {
            0
        };

        if operations.is_empty() {
            return Ok(CallToolResult::success(vec![Content::text("No changes to sync.")]));
        }

        // Apply changes (pass project_dir for operation tracking - RBXSYNC-77)
        let result = self.client.sync_batch(&operations, Some(&params.project_dir)).await.map_err(|e| mcp_error(e.to_string()))?;

        // Check if sync was skipped (disabled or extraction in progress)
        if let Some(ref data) = result.data {
            if let Some(ref reason) = data.reason {
                return Ok(CallToolResult::success(vec![Content::text(format!(
                    "Sync skipped: {}. Enable 'Files → Studio' in the RbxSync plugin or wait for extraction to complete.",
                    reason
                ))]));
            }
        }

        // Extract applied count from nested data or top-level field
        let applied = result.data.as_ref().map(|d| d.applied).unwrap_or(result.applied);
        let errors = result.data.as_ref().map(|d| d.errors.clone()).unwrap_or(result.errors);

        if result.success && errors.is_empty() {
            // Mark as synced for next incremental sync
            let _ = self.client.mark_synced(&params.project_dir).await;

            let sync_type = if incremental.full_sync { "full" } else { "incremental" };
            let msg = if delete_count > 0 {
                format!(
                    "Successfully synced {} instances ({} sync, checked {} files) and deleted {} orphans.",
                    applied, sync_type, incremental.files_checked, delete_count
                )
            } else {
                format!(
                    "Successfully synced {} instances to Studio ({} sync, {} of {} files modified).",
                    applied, sync_type, incremental.files_modified, incremental.files_checked
                )
            };
            Ok(CallToolResult::success(vec![Content::text(msg)]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Sync completed with errors: {:?}",
                errors
            ))]))
        }
    }

    /// Get the git status of a project directory.
    #[tool(description = "Get git status of the project")]
    async fn git_status(
        &self,
        Parameters(params): Parameters<GitStatusParams>,
    ) -> Result<CallToolResult, McpError> {
        let status = self.client.get_git_status(&params.project_dir).await.map_err(|e| mcp_error(e.to_string()))?;

        if !status.is_repo {
            return Ok(CallToolResult::success(vec![Content::text("Not a git repository.")]));
        }

        let mut lines = vec![format!("Branch: {}", status.branch.unwrap_or_default())];

        if !status.staged.is_empty() {
            lines.push(format!("Staged ({}):", status.staged.len()));
            for f in &status.staged {
                lines.push(format!("  + {}", f));
            }
        }

        if !status.modified.is_empty() {
            lines.push(format!("Modified ({}):", status.modified.len()));
            for f in &status.modified {
                lines.push(format!("  ~ {}", f));
            }
        }

        if !status.untracked.is_empty() {
            lines.push(format!("Untracked ({}):", status.untracked.len()));
            for f in &status.untracked {
                lines.push(format!("  ? {}", f));
            }
        }

        Ok(CallToolResult::success(vec![Content::text(lines.join("\n"))]))
    }

    /// Commit changes to git.
    #[tool(description = "Commit changes to git")]
    async fn git_commit(
        &self,
        Parameters(params): Parameters<GitCommitParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .git_commit(&params.project_dir, &params.message, params.files.as_deref())
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Committed: {}",
                result.hash.unwrap_or_default()
            ))]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Commit failed: {}",
                result.error.unwrap_or_default()
            ))]))
        }
    }

    /// Execute Luau code in Roblox Studio.
    #[tool(description = "Execute Luau code in Roblox Studio")]
    async fn run_code(
        &self,
        Parameters(params): Parameters<RunCodeParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client.run_code(&params.code).await.map_err(|e| mcp_error(e.to_string()))?;
        Ok(CallToolResult::success(vec![Content::text(result)]))
    }

    /// Run an automated play test in Roblox Studio and capture console output.
    /// Starts a play session, captures all prints/warnings/errors, then stops and returns output.
    /// For interactive bot testing, use background: true to start the test and return immediately,
    /// then use bot_observe/bot_move/bot_action while the test runs.
    /// IMPORTANT: Stop playtest with stop_test before making code changes.
    /// Changes won't take effect until you stop_test, sync, then run_test again.
    #[tool(description = "Run automated play test in Studio and return console output. For interactive bot testing, use background: true to start test and return immediately. IMPORTANT: Stop playtest with stop_test before making code changes.")]
    async fn run_test(
        &self,
        Parameters(params): Parameters<RunTestParams>,
    ) -> Result<CallToolResult, McpError> {
        // Start the test
        let start_result = self.client
            .start_test(params.duration, params.mode.as_deref())
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if !start_result.success {
            return Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to start test: {}",
                start_result.message.unwrap_or_default()
            ))]));
        }

        // Background mode: return immediately after starting the test
        if params.background.unwrap_or(false) {
            return Ok(CallToolResult::success(vec![Content::text(
                serde_json::json!({
                    "started": true,
                    "mode": params.mode.as_deref().unwrap_or("Play"),
                    "message": "Test started in background. Use bot_observe/bot_move/bot_action to interact."
                }).to_string()
            )]));
        }

        // Wait for test to complete (poll status)
        let duration_secs = params.duration.unwrap_or(5);
        let poll_interval = tokio::time::Duration::from_millis(500);
        let max_wait = tokio::time::Duration::from_secs((duration_secs + 5) as u64);
        let start_time = tokio::time::Instant::now();

        loop {
            tokio::time::sleep(poll_interval).await;

            let status = self.client.get_test_status().await.map_err(|e| mcp_error(e.to_string()))?;

            if status.complete || !status.in_progress {
                break;
            }

            if start_time.elapsed() > max_wait {
                break;
            }
        }

        // Finish and get results
        let result = self.client.finish_test().await.map_err(|e| mcp_error(e.to_string()))?;

        // Format output
        let mut output_lines = vec![
            format!("Test completed in {:.1}s", result.duration.unwrap_or(0.0)),
            format!("Total messages: {}", result.total_messages),
            String::new(),
        ];

        // Group by message type
        let errors: Vec<_> = result.output.iter().filter(|m| m.msg_type == "MessageError").collect();
        let warnings: Vec<_> = result.output.iter().filter(|m| m.msg_type == "MessageWarning").collect();
        let prints: Vec<_> = result.output.iter().filter(|m| m.msg_type == "MessageOutput").collect();

        if !errors.is_empty() {
            output_lines.push(format!("=== ERRORS ({}) ===", errors.len()));
            for msg in errors {
                output_lines.push(format!("[{:.2}s] {}", msg.timestamp, msg.message));
            }
            output_lines.push(String::new());
        }

        if !warnings.is_empty() {
            output_lines.push(format!("=== WARNINGS ({}) ===", warnings.len()));
            for msg in warnings {
                output_lines.push(format!("[{:.2}s] {}", msg.timestamp, msg.message));
            }
            output_lines.push(String::new());
        }

        if !prints.is_empty() {
            output_lines.push(format!("=== OUTPUT ({}) ===", prints.len()));
            for msg in prints {
                output_lines.push(format!("[{:.2}s] {}", msg.timestamp, msg.message));
            }
        }

        if let Some(err) = result.error {
            output_lines.insert(0, format!("Test error: {}", err));
        }

        Ok(CallToolResult::success(vec![Content::text(output_lines.join("\n"))]))
    }

    /// Stop any running playtest in Roblox Studio.
    /// Call this before making code changes - changes won't take effect until you stop the test,
    /// sync your changes, then run a new test.
    #[tool(description = "Stop any running playtest. Call before making code changes.")]
    async fn stop_test(&self) -> Result<CallToolResult, McpError> {
        let result = self.client.stop_test().await.map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(
                result.message.unwrap_or_else(|| "Playtest stopped successfully.".to_string())
            )]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to stop playtest: {}",
                result.error.unwrap_or_else(|| "Unknown error".to_string())
            ))]))
        }
    }

    // ========================================================================
    // Harness Tools (Multi-session AI game development tracking)
    // ========================================================================

    /// Initialize harness for a project.
    /// Creates the .rbxsync/harness directory structure with game.yaml and features.yaml.
    /// Call this once at the start of a new game project.
    #[tool(description = "Initialize harness for a project")]
    async fn harness_init(
        &self,
        Parameters(params): Parameters<HarnessInitParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .harness_init(
                &params.project_dir,
                &params.game_name,
                params.description.as_deref(),
                params.genre.as_deref(),
            )
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Harness initialized at {}. Game ID: {}",
                result.harness_dir,
                result.game_id.unwrap_or_default()
            ))]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to initialize harness: {}",
                result.message
            ))]))
        }
    }

    /// Start a new development session.
    /// Creates a session log to track work done across this conversation.
    /// Returns a session ID that can be used to end the session later.
    #[tool(description = "Start dev session, get context")]
    async fn harness_session_start(
        &self,
        Parameters(params): Parameters<HarnessSessionStartParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .harness_session_start(&params.project_dir, params.initial_goals.as_deref())
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Session started. ID: {}\nPath: {}",
                result.session_id.unwrap_or_default(),
                result.session_path.unwrap_or_default()
            ))]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to start session: {}",
                result.message
            ))]))
        }
    }

    /// End a development session.
    /// Updates the session log with summary and handoff notes for future sessions.
    #[tool(description = "End session with handoff notes")]
    async fn harness_session_end(
        &self,
        Parameters(params): Parameters<HarnessSessionEndParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .harness_session_end(
                &params.project_dir,
                &params.session_id,
                params.summary.as_deref(),
                params.handoff_notes.as_deref(),
            )
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(
                "Session ended successfully."
            )]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to end session: {}",
                result.message
            ))]))
        }
    }

    /// Create or update a feature in the project.
    /// Features track game functionality being developed across sessions.
    /// Provide feature_id to update an existing feature, or name to create a new one.
    #[tool(description = "Create/update feature status")]
    async fn harness_feature_update(
        &self,
        Parameters(params): Parameters<HarnessFeatureUpdateParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .harness_feature_update(
                &params.project_dir,
                params.feature_id.as_deref(),
                params.name.as_deref(),
                params.description.as_deref(),
                params.status.as_deref(),
                params.priority.as_deref(),
                params.tags.as_deref(),
                params.add_note.as_deref(),
                params.session_id.as_deref(),
            )
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if result.success {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Feature {}: {}",
                result.feature_id.unwrap_or_default(),
                result.message
            ))]))
        } else {
            Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to update feature: {}",
                result.message
            ))]))
        }
    }

    /// Insert a model from the Roblox marketplace into the game.
    /// Uses InsertService:LoadAsset to fetch the model by asset ID.
    /// Returns the inserted model's name, path, and className.
    #[tool(description = "Insert a Roblox marketplace model by asset ID into Studio")]
    async fn insert_model(
        &self,
        Parameters(params): Parameters<InsertModelParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .insert_model(params.asset_id, params.parent.as_deref())
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if !result.success {
            return Ok(CallToolResult::success(vec![Content::text(format!(
                "Failed to insert model: {}",
                result.error.unwrap_or_default()
            ))]));
        }

        let inserted_name = result.inserted_name.unwrap_or_else(|| "Unknown".to_string());
        let inserted_path = result.inserted_path.unwrap_or_else(|| "Unknown".to_string());
        let class_name = result.class_name.unwrap_or_else(|| "Unknown".to_string());

        Ok(CallToolResult::success(vec![Content::text(format!(
            "Successfully inserted model:\n  Name: {}\n  Path: {}\n  ClassName: {}",
            inserted_name, inserted_path, class_name
        ))]))
    }

    /// Get current harness state for a project.
    /// Returns game info, features list with status summary, and recent sessions.
    #[tool(description = "Get current harness state")]
    async fn harness_status(
        &self,
        Parameters(params): Parameters<HarnessStatusParams>,
    ) -> Result<CallToolResult, McpError> {
        let result = self.client
            .harness_status(&params.project_dir)
            .await
            .map_err(|e| mcp_error(e.to_string()))?;

        if !result.initialized {
            return Ok(CallToolResult::success(vec![Content::text(
                "Harness not initialized. Use harness_init to set up the project."
            )]));
        }

        let mut output = vec!["=== Harness Status ===".to_string()];

        // Game info
        if let Some(game) = &result.game {
            let name = game.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
            output.push(format!("\nGame: {}", name));
            if let Some(desc) = game.get("description").and_then(|v| v.as_str()) {
                if !desc.is_empty() {
                    output.push(format!("Description: {}", desc));
                }
            }
        }

        // Feature summary
        let summary = &result.feature_summary;
        output.push(format!(
            "\nFeatures: {} total ({} planned, {} in progress, {} completed, {} blocked)",
            summary.total, summary.planned, summary.in_progress, summary.completed, summary.blocked
        ));

        // List features
        if !result.features.is_empty() {
            output.push("\nFeature List:".to_string());
            for feature in &result.features {
                let id = feature.get("id").and_then(|v| v.as_str()).unwrap_or("?");
                let name = feature.get("name").and_then(|v| v.as_str()).unwrap_or("Unnamed");
                let status = feature.get("status").and_then(|v| v.as_str()).unwrap_or("unknown");
                output.push(format!("  - [{}] {} ({})", id, name, status));
            }
        }

        // Recent sessions
        if !result.recent_sessions.is_empty() {
            output.push("\nRecent Sessions:".to_string());
            for session in &result.recent_sessions {
                let status = if session.ended_at.is_some() { "ended" } else { "active" };
                output.push(format!(
                    "  - {} ({}, {} features)",
                    session.id, status, session.features_count
                ));
                if !session.summary.is_empty() {
                    output.push(format!("    Summary: {}", session.summary));
                }
            }
        }

        Ok(CallToolResult::success(vec![Content::text(output.join("\n"))]))
    }
}

#[tool_handler]
impl ServerHandler for RbxSyncServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2024_11_05,
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            server_info: Implementation::from_build_env(),
            instructions: Some(
                "RbxSync MCP Server - Extract and sync Roblox games with git integration. \
                 Requires 'rbxsync serve' running and the RbxSync Studio plugin installed."
                    .to_string(),
            ),
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Set up logging to stderr (stdio is for MCP protocol)
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .with_writer(std::io::stderr)
                .with_ansi(false),
        )
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    tracing::info!("Starting RbxSync MCP server...");

    let service = RbxSyncServer::new().serve(stdio()).await?;
    service.waiting().await?;

    Ok(())
}
