#!/bin/bash
echo "🔍 GitHub Repository Verification"
echo "================================"

echo "1. Checking repository exists..."
if curl -s "https://api.github.com/repos/horbolsi/8x8org-app" | grep -q '"name"'; then
    echo "   ✅ Repository exists: 8x8org-app"
else
    echo "   ❌ Repository not found"
    exit 1
fi

echo ""
echo "2. Listing files in repository..."
curl -s "https://api.github.com/repos/horbolsi/8x8org-app/contents" | \
    grep -o '"name": "[^"]*"' | cut -d'"' -f4 | while read file; do
    echo "   📄 $file"
done

echo ""
echo "3. Checking last commit..."
curl -s "https://api.github.com/repos/horbolsi/8x8org-app/commits" | \
    grep -o '"message": "[^"]*"' | head -1 | cut -d'"' -f4

echo ""
echo "✅ Verification complete!"
echo "📊 Repository URL: https://github.com/horbolsi/8x8org-app"
echo "👁️  View in browser to confirm everything is there"
