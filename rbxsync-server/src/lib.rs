//! RbxSync Server
//!
//! HTTP server that communicates with the Roblox Studio plugin
//! for game extraction and synchronization.

use std::collections::{HashMap, VecDeque};
use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, watch, Mutex, RwLock};
use uuid::Uuid;

/// Server configuration
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub port: u16,
    pub host: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: 44755,
            host: "127.0.0.1".to_string(),
        }
    }
}

/// Shared application state
pub struct AppState {
    /// Queue of pending requests to send to the plugin
    pub request_queue: Mutex<VecDeque<PluginRequest>>,

    /// Map of request ID to response channel
    pub response_channels: RwLock<HashMap<Uuid, mpsc::UnboundedSender<PluginResponse>>>,

    /// Trigger to wake up long-polling requests
    pub trigger: watch::Sender<()>,

    /// Receiver for trigger notifications
    pub trigger_rx: watch::Receiver<()>,

    /// Active extraction session
    pub extraction_session: RwLock<Option<ExtractionSession>>,
}

impl AppState {
    pub fn new() -> Arc<Self> {
        let (trigger, trigger_rx) = watch::channel(());
        Arc::new(Self {
            request_queue: Mutex::new(VecDeque::new()),
            response_channels: RwLock::new(HashMap::new()),
            trigger,
            trigger_rx,
            extraction_session: RwLock::new(None),
        })
    }
}

/// Request to send to the Studio plugin
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginRequest {
    pub id: Uuid,
    pub command: String,
    pub payload: serde_json::Value,
}

/// Response from the Studio plugin
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginResponse {
    pub id: Uuid,
    pub success: bool,
    pub data: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Active extraction session state
#[derive(Debug)]
pub struct ExtractionSession {
    pub id: Uuid,
    pub chunks_received: usize,
    pub total_chunks: Option<usize>,
    pub data: Vec<serde_json::Value>,
}

/// Create the main router
pub fn create_router(state: Arc<AppState>) -> Router {
    Router::new()
        // Plugin communication endpoints (compatible with roblox-mcp)
        .route("/request", get(handle_request_poll))
        .route("/response", post(handle_response))
        // New extraction endpoints
        .route("/extract/start", post(handle_extract_start))
        .route("/extract/chunk", post(handle_extract_chunk))
        .route("/extract/status", get(handle_extract_status))
        // Health check
        .route("/health", get(handle_health))
        .with_state(state)
}

/// Health check endpoint
async fn handle_health() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// Long-polling endpoint for plugin to receive requests
async fn handle_request_poll(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    // Wait for a request or timeout after 15 seconds
    let timeout = tokio::time::Duration::from_secs(15);
    let mut trigger_rx = state.trigger_rx.clone();

    tokio::select! {
        _ = tokio::time::sleep(timeout) => {
            // Timeout - return empty response
            (StatusCode::NO_CONTENT, Json(serde_json::json!(null)))
        }
        _ = trigger_rx.changed() => {
            // Check if there's a request
            let mut queue = state.request_queue.lock().await;
            if let Some(request) = queue.pop_front() {
                (StatusCode::OK, Json(serde_json::to_value(&request).unwrap()))
            } else {
                (StatusCode::NO_CONTENT, Json(serde_json::json!(null)))
            }
        }
    }
}

/// Handle response from plugin
async fn handle_response(
    State(state): State<Arc<AppState>>,
    Json(response): Json<PluginResponse>,
) -> impl IntoResponse {
    let channels = state.response_channels.read().await;
    if let Some(sender) = channels.get(&response.id) {
        let _ = sender.send(response);
    }
    StatusCode::OK
}

/// Start extraction request
#[derive(Debug, Deserialize)]
pub struct ExtractStartRequest {
    /// Services to extract
    pub services: Option<Vec<String>>,
    /// Include terrain
    pub include_terrain: Option<bool>,
    /// Include binary assets
    pub include_assets: Option<bool>,
}

async fn handle_extract_start(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ExtractStartRequest>,
) -> impl IntoResponse {
    let session_id = Uuid::new_v4();

    // Create extraction session
    {
        let mut session = state.extraction_session.write().await;
        *session = Some(ExtractionSession {
            id: session_id,
            chunks_received: 0,
            total_chunks: None,
            data: Vec::new(),
        });
    }

    // Queue request to plugin
    let plugin_request = PluginRequest {
        id: session_id,
        command: "extract:start".to_string(),
        payload: serde_json::json!({
            "services": req.services.unwrap_or_default(),
            "includeTerrain": req.include_terrain.unwrap_or(true),
            "includeAssets": req.include_assets.unwrap_or(true),
        }),
    };

    {
        let mut queue = state.request_queue.lock().await;
        queue.push_back(plugin_request);
    }
    let _ = state.trigger.send(());

    Json(serde_json::json!({
        "sessionId": session_id,
        "status": "started"
    }))
}

/// Handle extraction chunk from plugin
#[derive(Debug, Deserialize)]
pub struct ExtractChunkRequest {
    pub session_id: Uuid,
    pub chunk_index: usize,
    pub total_chunks: usize,
    pub data: serde_json::Value,
}

async fn handle_extract_chunk(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ExtractChunkRequest>,
) -> impl IntoResponse {
    let mut session_guard = state.extraction_session.write().await;

    if let Some(ref mut session) = *session_guard {
        if session.id != req.session_id {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "Invalid session ID"})),
            );
        }

        session.total_chunks = Some(req.total_chunks);
        session.chunks_received += 1;
        session.data.push(req.data);

        (
            StatusCode::OK,
            Json(serde_json::json!({
                "received": session.chunks_received,
                "total": req.total_chunks
            })),
        )
    } else {
        (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "No active extraction session"})),
        )
    }
}

/// Get extraction status
async fn handle_extract_status(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let session = state.extraction_session.read().await;

    if let Some(ref s) = *session {
        Json(serde_json::json!({
            "sessionId": s.id,
            "chunksReceived": s.chunks_received,
            "totalChunks": s.total_chunks,
            "complete": s.total_chunks.map(|t| s.chunks_received >= t).unwrap_or(false)
        }))
    } else {
        Json(serde_json::json!({
            "sessionId": null,
            "status": "no_active_session"
        }))
    }
}

/// Start the server
pub async fn run_server(config: ServerConfig) -> anyhow::Result<()> {
    let state = AppState::new();
    let router = create_router(state);

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("RbxSync server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, router).await?;

    Ok(())
}
