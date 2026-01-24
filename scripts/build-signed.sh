#!/bin/bash
# Build signed Tauri app using credentials from tauri-build-info.json
#
# Usage: npm run tauri:build:signed
#        or: bash scripts/build-signed.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/tauri-build-info.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found"
  echo ""
  echo "Create this file with your signing credentials:"
  echo '{'
  echo '  "APPLE_SIGNING_IDENTITY": "Developer ID Application: Your Name (TEAMID)",'
  echo '  "APPLE_ID": "your@email.com",'
  echo '  "APPLE_PASSWORD": "your-app-specific-password",'
  echo '  "APPLE_TEAM_ID": "YOURTEAMID",'
  echo '  "TAURI_SIGNING_PRIVATE_KEY": "base64-encoded-key",'
  echo '  "TAURI_SIGNING_PRIVATE_KEY_PASSWORD": "your-key-password"'
  echo '}'
  exit 1
fi

# Read JSON and export as environment variables
export APPLE_SIGNING_IDENTITY=$(node -p "require('$CONFIG_FILE').APPLE_SIGNING_IDENTITY")
export APPLE_ID=$(node -p "require('$CONFIG_FILE').APPLE_ID")
export APPLE_PASSWORD=$(node -p "require('$CONFIG_FILE').APPLE_PASSWORD")
export APPLE_TEAM_ID=$(node -p "require('$CONFIG_FILE').APPLE_TEAM_ID")
export TAURI_SIGNING_PRIVATE_KEY=$(node -p "require('$CONFIG_FILE').TAURI_SIGNING_PRIVATE_KEY")
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=$(node -p "require('$CONFIG_FILE').TAURI_SIGNING_PRIVATE_KEY_PASSWORD")

echo "Building signed Tauri app..."
echo "  APPLE_ID: $APPLE_ID"
echo "  APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo "  APPLE_SIGNING_IDENTITY: ${APPLE_SIGNING_IDENTITY:0:30}..."
echo ""

cd "$PROJECT_ROOT"
npx tauri build
