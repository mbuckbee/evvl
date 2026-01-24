#!/bin/bash

# Build script for Tauri that excludes server-only routes
# These routes use Vercel KV and can't be statically exported

set -e

BACKUP_DIR=".tauri-build-backup"

# Directories to exclude (server-only features)
# All API routes are excluded since they're server-side and won't work in static export
# Backroom is admin-only and requires server features
EXCLUDE_DIRS=(
  "app/api"
  "app/backroom"
  "app/s"
)

# Backup server-only routes
echo "Backing up server-only routes..."
mkdir -p "$BACKUP_DIR"
for dir in "${EXCLUDE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname $dir)"
    mv "$dir" "$BACKUP_DIR/$dir"
  fi
done

# Run the Next.js build
echo "Building for Tauri..."
BUILD_MODE=tauri next build
BUILD_EXIT_CODE=$?

# Restore server-only routes
echo "Restoring server-only routes..."
for dir in "${EXCLUDE_DIRS[@]}"; do
  if [ -d "$BACKUP_DIR/$dir" ]; then
    mv "$BACKUP_DIR/$dir" "$dir"
  fi
done
rm -rf "$BACKUP_DIR" 2>/dev/null || true

exit $BUILD_EXIT_CODE
