#!/bin/bash
# Auto-sync script - runs every hour
LOG_FILE="/home/runner/8x8org-sync.log"
echo "[$(date)] Starting auto-sync..." >> "$LOG_FILE"

cd /home/runner/workspace

# Simple sync
git add . >> "$LOG_FILE" 2>&1
git commit -m "Auto: $(date)" >> "$LOG_FILE" 2>&1 || true
git push https://horbolsi:GITHUB_TOKEN_PLACEHOLDER@github.com/horbolsi/8x8org-app.git main >> "$LOG_FILE" 2>&1

echo "[$(date)] Sync completed" >> "$LOG_FILE"
