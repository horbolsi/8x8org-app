#!/bin/bash
echo "REMOVING HARDCODED SECRETS..."

# Backup original
cp -r bots bots.backup

# Replace Telegram tokens
find . -type f -name "*.js" -exec sed -i "s/8483409837:AAHlkybBMXCresCdhRkZfK899L_UCQV4BJo/\${APP_BOT_TOKEN}/g" {} \;
find . -type f -name "*.js" -exec sed -i "s/8560756875:AAEoF7o7BArG0tody_Rk4CSrKsNLqwHlko8/\${TELEGRAM_BOT_TOKEN}/g" {} \;
find . -type f -name "*.js" -exec sed -i "s/8589124260:AAEzGzhv1_wiwXvTh-v9x6SFX0O-yKrskhg/\${OUT_BOT_TOKEN}/g" {} \;

# Check what's left
echo "=== Checking for remaining hardcoded secrets ==="
grep -r "8[0-9]\{9\}:" --include="*.js" --include="*.json" . || echo "No hardcoded tokens found"
