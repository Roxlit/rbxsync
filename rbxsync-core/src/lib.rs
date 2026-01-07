//! RbxSync Core Library
//!
//! This crate provides the core functionality for RbxSync:
//! - Roblox property type definitions and serialization
//! - Instance representation
//! - Project configuration
//! - File system operations

pub mod types;

// Re-export commonly used types
pub use types::{
    AttributeValue, CFrame, Color3, EnumValue, Instance, InstanceMeta, ProjectConfig,
    PropertyValue, Vector2, Vector3,
};
