# RbxSync Installer for Windows
# Run with: irm https://raw.githubusercontent.com/devmarissa/rbxsync/master/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"

# ASCII Art Header
Write-Host ""
Write-Host "  ____  _          ____                   " -ForegroundColor Cyan
Write-Host " |  _ \| |____  __/ ___| _   _ _ __   ___ " -ForegroundColor Cyan
Write-Host " | |_) | '_ \ \/ /\___ \| | | | '_ \ / __|" -ForegroundColor Cyan
Write-Host " |  _ <| |_) >  <  ___) | |_| | | | | (__ " -ForegroundColor Cyan
Write-Host " |_| \_\_.__/_/\_\|____/ \__, |_| |_|\___|" -ForegroundColor Cyan
Write-Host "                         |___/            " -ForegroundColor Cyan
Write-Host ""
Write-Host "RbxSync Installer for Windows" -ForegroundColor White
Write-Host ""

# Check if running on Windows
if ($env:OS -ne "Windows_NT") {
    Write-Host "Error: This installer is for Windows only." -ForegroundColor Red
    Write-Host "For macOS, use:"
    Write-Host "  curl -fsSL https://raw.githubusercontent.com/devmarissa/rbxsync/master/scripts/install.sh | sh"
    exit 1
}

# Get latest version from GitHub
Write-Host "Fetching latest version..." -ForegroundColor Blue
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/devmarissa/rbxsync/releases/latest"
    $VERSION = $release.tag_name
} catch {
    Write-Host "Error: Could not fetch latest version from GitHub." -ForegroundColor Red
    Write-Host "Please check your internet connection or try again later."
    exit 1
}

Write-Host "Latest version: $VERSION" -ForegroundColor Green
Write-Host ""

# Download URL
$BINARY = "rbxsync-windows-x86_64.exe"
$DOWNLOAD_URL = "https://github.com/devmarissa/rbxsync/releases/download/$VERSION/$BINARY"

# Install directory
$INSTALL_DIR = "$env:LOCALAPPDATA\rbxsync"

# Create install directory if it doesn't exist
if (-not (Test-Path $INSTALL_DIR)) {
    Write-Host "Creating install directory: $INSTALL_DIR" -ForegroundColor Blue
    New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
}

# Download binary
Write-Host "Downloading $BINARY..." -ForegroundColor Blue
$DEST = "$INSTALL_DIR\rbxsync.exe"

try {
    Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $DEST -UseBasicParsing
} catch {
    Write-Host "Error: Failed to download binary." -ForegroundColor Red
    Write-Host "URL: $DOWNLOAD_URL"
    exit 1
}

# Add to PATH if not already there
$UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPath -notlike "*$INSTALL_DIR*") {
    Write-Host "Adding to PATH..." -ForegroundColor Blue
    [Environment]::SetEnvironmentVariable("PATH", "$UserPath;$INSTALL_DIR", "User")
    $env:PATH = "$env:PATH;$INSTALL_DIR"
}

# Verify installation
Write-Host ""
Write-Host "RbxSync installed successfully!" -ForegroundColor Green
Write-Host ""

# Try to run version command
try {
    & $DEST version
} catch {
    Write-Host "Installed to: $DEST" -ForegroundColor White
}

Write-Host ""
Write-Host "Get started:" -ForegroundColor White
Write-Host "  rbxsync init      - Initialize a new project" -ForegroundColor Gray
Write-Host "  rbxsync serve     - Start the sync server" -ForegroundColor Gray
Write-Host "  rbxsync --help    - Show all commands" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: https://rbxsync.dev" -ForegroundColor Blue
Write-Host ""
Write-Host "NOTE: Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
