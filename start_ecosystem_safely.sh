#!/bin/bash

echo "=== STARTING 8X8ORG ECOSYSTEM SAFELY ==="
echo "Owner: FlashTM8 (1950324763)"
echo "Signature: 8x8org by FlashTM8 ⚡️"
echo ""

# Check if already running
if ps aux | grep -q "start_bots_safe.js" | grep -v grep; then
    echo "❌ Ecosystem is already running!"
    echo "Running PIDs:"
    ps aux | grep "start_bots_safe.js" | grep -v grep
    echo ""
    echo "To stop: pkill -f 'start_bots_safe.js'"
    echo "Then run this script again."
    exit 1
fi

# Check for duplicate bot processes
duplicate_bots=$(ps aux | grep -c "node.*bot")
if [ "$duplicate_bots" -gt 5 ]; then
    echo "⚠️  Multiple bot instances detected. Cleaning up..."
    ./fix_polling_error.sh
    exit 0
fi

echo "✅ No duplicate instances found."
echo "Starting ecosystem..."

# Export environment
export NODE_ENV=production

# Start the system
node start_bots_safe.js
