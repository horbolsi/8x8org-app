# 📁 8x8org GitHub Sync

## Your Repository:
https://github.com/horbolsi/8x8org-app

## Setup (One Time):
1. Run: ./setup-git-credentials.sh
2. Enter token: REDACTED

## Daily Use:
Just run: ./git-push

That's it! Your code will be backed up to GitHub.

## Other Commands:
- ./github-manager.sh - Interactive menu
- git status - Check changes
- git log --oneline - View history

## Notes:
- Token is stored securely in ~/.git-credentials
- No tokens in code files (safe from GitHub scanning)
- Auto-cleans .env and database files before push
