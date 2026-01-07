//! Roblox property types and serialization
//!
//! This module defines all Roblox property types and their JSON representations.
//! The goal is to capture every possible property value with full fidelity.

mod properties;
mod instance;
mod project;

pub use properties::*;
pub use instance::*;
pub use project::*;
