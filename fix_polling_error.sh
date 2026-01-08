#!/bin/bash

echo "=== FIXING TELEGRAM POLLING ERROR ==="
echo "Error: 'terminated by other getUpdates request'"
echo "This means multiple bot instances are running with the same token."
echo ""

echo "1. Killing all existing bot processes..."
pkill -f "node.*bot" 2>/dev/null
pkill -f "start_bots" 2>/dev/null
sleep 3

echo "2. Checking for remaining processes..."
remaining=$(ps aux | grep -c "node.*bot")
if [ "$remaining" -gt 0 ]; then
    echo "⚠️  Some processes still running, forcing kill..."
    killall -9 node 2>/dev/null || true
    sleep 2
fi

echo "3. Cleaning up PID files..."
rm -f /tmp/*bot*.pid 2>/dev/null || true
rm -f ./bot_pids.txt 2>/dev/null || true

echo "4. Starting fresh instance..."
echo "   Only ONE instance should run at a time."
echo "   Starting in 5 seconds..."
sleep 5

# Start fresh
node start_bots_safe.js
