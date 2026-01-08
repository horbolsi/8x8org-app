#!/bin/bash
echo "=== BOT SYSTEM DEBUG INFORMATION ==="
echo "Generated: $(date)"
echo ""

echo "1. SYSTEM INFO:"
echo "   Node: $(node --version)"
echo "   NPM: $(npm --version)"
echo "   OS: $(uname -a)"
echo "   PWD: $(pwd)"

echo ""
echo "2. ENVIRONMENT VARIABLES (safe):"
env | grep -i "bot\|token\|key\|secret\|database" | while read line; do
    key=$(echo $line | cut -d= -f1)
    value=$(echo $line | cut -d= -f2-)
    if [[ $key == *"TOKEN"* ]] || [[ $key == *"KEY"* ]] || [[ $key == *"SECRET"* ]]; then
        if [ ${#value} -gt 8 ]; then
            masked="${value:0:4}****${value: -4}"
        else
            masked="****"
        fi
        echo "   $key=$masked"
    else
        echo "   $line"
    fi
done

echo ""
echo "3. DIRECTORY STRUCTURE:"
find . -maxdepth 3 -type f -name "*.js" -o -name "*.json" -o -name "*.env*" | sort | head -20

echo ""
echo "4. RUNNING PROCESSES:"
ps aux | grep -i "node.*bot" | grep -v grep || echo "   No bot processes running"

echo ""
echo "5. NPM PACKAGES:"
npm list --depth=0 2>/dev/null | grep -E "(telegraf|telegram|sequelize|winston|axios|dotenv)" || echo "   Error checking packages"

echo ""
echo "=== END OF DEBUG INFO ==="
