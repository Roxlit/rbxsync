#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}"
echo "  ____  _          ____                   "
echo " |  _ \| |____  __/ ___| _   _ _ __   ___ "
echo " | |_) | '_ \ \/ /\___ \| | | | '_ \ / __|"
echo " |  _ <| |_) >  <  ___) | |_| | | | | (__ "
echo " |_| \_\_.__/_/\_\|____/ \__, |_| |_|\___|"
echo "                         |___/            "
echo -e "${NC}"
echo -e "${BOLD}RbxSync Installer for macOS${NC}"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}Error: This installer is for macOS only.${NC}"
    echo "For Windows, use the PowerShell installer:"
    echo "  irm https://raw.githubusercontent.com/devmarissa/rbxsync/master/scripts/install.ps1 | iex"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    arm64)
        BINARY="rbxsync-macos-aarch64"
        ARCH_NAME="Apple Silicon"
        ;;
    x86_64)
        BINARY="rbxsync-macos-x86_64"
        ARCH_NAME="Intel"
        ;;
    *)
        echo -e "${RED}Error: Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

echo -e "Detected: macOS ${BOLD}$ARCH_NAME${NC} ($ARCH)"
echo ""

# Get latest version from GitHub API
echo -e "${BLUE}Fetching latest version...${NC}"
VERSION=$(curl -s https://api.github.com/repos/devmarissa/rbxsync/releases/latest | grep '"tag_name"' | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not fetch latest version from GitHub.${NC}"
    echo "Please check your internet connection or try again later."
    exit 1
fi

echo -e "Latest version: ${GREEN}$VERSION${NC}"
echo ""

# Download URL
DOWNLOAD_URL="https://github.com/devmarissa/rbxsync/releases/download/$VERSION/$BINARY"

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Download binary
echo -e "${BLUE}Downloading $BINARY...${NC}"
if ! curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_DIR/rbxsync"; then
    echo -e "${RED}Error: Failed to download binary.${NC}"
    echo "URL: $DOWNLOAD_URL"
    exit 1
fi

# Make executable
chmod +x "$TEMP_DIR/rbxsync"

# Install to /usr/local/bin
INSTALL_DIR="/usr/local/bin"
echo -e "${BLUE}Installing to $INSTALL_DIR...${NC}"

if [ -w "$INSTALL_DIR" ]; then
    mv "$TEMP_DIR/rbxsync" "$INSTALL_DIR/rbxsync"
else
    echo "Requesting administrator privileges..."
    sudo mv "$TEMP_DIR/rbxsync" "$INSTALL_DIR/rbxsync"
fi

# Verify installation
echo ""
if command -v rbxsync &> /dev/null; then
    echo -e "${GREEN}${BOLD}RbxSync installed successfully!${NC}"
    echo ""
    rbxsync version
    echo ""
    echo -e "Get started:"
    echo -e "  ${BOLD}rbxsync init${NC}      - Initialize a new project"
    echo -e "  ${BOLD}rbxsync serve${NC}     - Start the sync server"
    echo -e "  ${BOLD}rbxsync --help${NC}    - Show all commands"
    echo ""
    echo -e "Documentation: ${BLUE}https://rbxsync.dev${NC}"
else
    echo -e "${RED}Error: Installation may have failed.${NC}"
    echo "Please ensure /usr/local/bin is in your PATH."
    exit 1
fi
