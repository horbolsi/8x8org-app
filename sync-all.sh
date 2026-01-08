#!/bin/bash
echo "🚀 8x8org Complete Sync"
echo "======================"

cd /home/runner/workspace

# Backup
echo "📦 Backing up sensitive files..."
cp .env /tmp/.env.backup 2>/dev/null || true
cp database/*.db /tmp/db.backup 2>/dev/null || true

# Clean
echo "🧹 Cleaning for git..."
rm -f .env 2>/dev/null || true
rm -f database/*.db 2>/dev/null || true

# Git operations
echo "💾 Git operations..."
git add .
if git diff --cached --quiet; then
    echo "✅ No changes"
else
    git commit -m "Sync: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "📤 Pushing to GitHub..."
    git push https://horbolsi:GITHUB_TOKEN_PLACEHOLDER@github.com/horbolsi/8x8org-app.git main
    echo "✅ Push complete!"
fi

# Restore
echo "🔄 Restoring files..."
cp /tmp/.env.backup .env 2>/dev/null || true
cp /tmp/db.backup database/*.db 2>/dev/null || true

echo ""
echo "🎉 Sync complete!"
echo "📁 Repository: https://github.com/horbolsi/8x8org-app"
