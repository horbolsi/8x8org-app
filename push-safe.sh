#!/bin/bash
# Safe push script - doesn't store token in files

# Function to get token
get_token() {
    # Try environment first
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN"
        return
    fi
    
    # Try stored file
    if [ -f ~/.github_token ]; then
        cat ~/.github_token
        return
    fi
    
    # Ask user
    read -sp "GitHub token: " token
    echo ""
    echo "$token"
}

TOKEN=$(get_token)

if [ -z "$TOKEN" ]; then
    echo "❌ No token available"
    exit 1
fi

cd /home/runner/workspace

# Clean sensitive files
rm -f .env 2>/dev/null || true
rm -f database/*.db 2>/dev/null || true

# Git operations
git add .
if ! git diff --cached --quiet; then
    git commit -m "Safe push: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Pushing..."
    git push https://horbolsi:$TOKEN@github.com/horbolsi/8x8org-app.git main
    echo "✅ Push complete"
else
    echo "✅ No changes"
fi

# Clear token from shell history
history -c
