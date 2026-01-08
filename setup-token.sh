#!/bin/bash
echo "🔑 GitHub Token Setup"
echo "===================="

echo "Get token from: https://github.com/settings/tokens"
echo "Required scope: 'repo'"
echo ""
read -sp "Enter your GitHub token: " token
echo ""

if [ -z "$token" ]; then
    echo "❌ Token cannot be empty"
    exit 1
fi

# Save to file
echo "$token" > ~/.github_token
chmod 600 ~/.github_token

# Set environment variable
export GITHUB_TOKEN="$token"
echo "export GITHUB_TOKEN='$token'" >> ~/.bashrc

echo "✅ Token saved!"
echo "🔒 Stored in: ~/.github_token"
echo "🔄 Added to ~/.bashrc"
echo ""
echo "Now use: ./gsync-clean  or  ./backup-clean"
