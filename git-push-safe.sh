#!/bin/bash
# Safe git push without exposing tokens
echo "🔒 Safe GitHub Sync"
echo "=================="

cd /home/runner/workspace

# Backup sensitive files first
mkdir -p /tmp/workspace-backup
cp .env /tmp/workspace-backup/ 2>/dev/null || true
cp database/8x8org.db /tmp/workspace-backup/ 2>/dev/null || true

# Clean sensitive files before commit
echo "Cleaning sensitive files..."
rm -f .env 2>/dev/null || true
rm -f database/*.db 2>/dev/null || true

# Add and commit
echo "Adding files to git..."
git add .

if ! git diff --cached --quiet; then
    echo "Committing changes..."
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push using token from environment
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Enter GitHub Personal Access Token:"
        read -s token
        export GITHUB_TOKEN="$token"
    fi
    
    echo "Pushing to GitHub..."
    git push https://horbolsi:$GITHUB_TOKEN@github.com/horbolsi/8x8org-app.git main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo "📊 Repository: https://github.com/horbolsi/8x8org-app"
    else
        echo "❌ Push failed. Check your token and network connection."
    fi
else
    echo "✅ No changes to push"
fi

# Restore sensitive files
echo "Restoring sensitive files..."
cp /tmp/workspace-backup/.env . 2>/dev/null || true
cp /tmp/workspace-backup/8x8org.db database/ 2>/dev/null || true

echo ""
echo "🔄 Sync completed at: $(date '+%H:%M:%S')"
