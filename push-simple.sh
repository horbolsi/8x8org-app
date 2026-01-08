#!/bin/bash
cd /home/runner/workspace
git add .
git commit -m "push: $(date)" 2>/dev/null || true
git push origin main
echo "✅ Pushed to GitHub"
