#!/bin/bash

echo "=== COMPLETE 8X8ORG ECOSYSTEM TEST ==="
echo "Owner: FlashTM8 (1950324763)"
echo "Email: xorgbytm8@gmail.com"
echo "Signature: 8x8org by FlashTM8 ⚡️"
echo "Date: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to test bot token
test_bot_token() {
    local bot_name=$1
    local token=$2
    
    if [ -z "$token" ] || [[ "$token" == *"your_"* ]] || [[ "$token" == *"change_this"* ]]; then
        echo -e "${RED}❌ $bot_name: Token not configured${NC}"
        return 1
    fi
    
    # Check token format (basic check)
    if [[ "$token" =~ ^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$ ]]; then
        echo -e "${GREEN}✅ $bot_name: Token format OK${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ $bot_name: Token format may be incorrect${NC}"
        return 0
    fi
}

echo "1. CHECKING ENVIRONMENT CONFIGURATION"
echo "-------------------------------------"

# Load environment
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    source .env 2>/dev/null || true
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo ""
echo "2. TESTING BOT TOKENS"
echo "---------------------"

test_bot_token "Main Bot" "$MAIN_BOT_TOKEN"
test_bot_token "OUT Bot" "$OUT_BOT_TOKEN"
test_bot_token "IN Bot" "$IN_BOT_TOKEN"
test_bot_token "Airdrop Bot" "$AIRDROP_BOT_TOKEN"
test_bot_token "Wallet Bot" "$WALLET_BOT_TOKEN"
test_bot_token "NFT Bot" "$NFT_BOT_TOKEN"

echo ""
echo "3. TESTING EMAIL CONFIGURATION"
echo "------------------------------"

if [ -n "$EMAIL_USER" ] && [ -n "$EMAIL_PASS" ]; then
    echo -e "${GREEN}✅ Email credentials configured${NC}"
    echo -e "   User: $EMAIL_USER"
    
    # Test email connection
    echo "Testing email connection..."
    node test_email.js 2>&1 | grep -E "(✅|❌|Connection|Test email)" || true
else
    echo -e "${YELLOW}⚠️ Email credentials not configured${NC}"
fi

echo ""
echo "4. CHECKING ADMIN CONFIGURATION"
echo "-------------------------------"

if [ "$ADMIN_TELEGRAM_ID" == "1950324763" ]; then
    echo -e "${GREEN}✅ Admin ID correctly set to 1950324763${NC}"
else
    echo -e "${RED}❌ Admin ID incorrect: $ADMIN_TELEGRAM_ID${NC}"
    echo -e "${YELLOW}⚠️ Should be: 1950324763${NC}"
fi

echo ""
echo "5. STARTING BOT ECOSYSTEM (30 SECOND TEST)"
echo "------------------------------------------"

# Kill any running bots
pkill -f "node.*bot" 2>/dev/null || true

echo "Starting ecosystem..."
node start_bots_safe.js &
START_PID=$!
sleep 10

echo ""
echo "6. CHECKING RUNNING BOTS"
echo "------------------------"

declare -A bot_pids
bot_pids=(
    ["Main Bot"]=$(ps aux | grep "main_bot/index.js" | grep -v grep | awk '{print $2}')
    ["OUT Bot"]=$(ps aux | grep "out_bot/index.js" | grep -v grep | awk '{print $2}')
    ["IN Bot"]=$(ps aux | grep "in_bot/index.js" | grep -v grep | awk '{print $2}')
    ["Airdrop Bot"]=$(ps aux | grep "airdrop_bot/index.js" | grep -v grep | awk '{print $2}')
    ["Wallet Bot"]=$(ps aux | grep "wallet_bot/index.js" | grep -v grep | awk '{print $2}')
    ["NFT Bot"]=$(ps aux | grep "nft_marketplace/index.js" | grep -v grep | awk '{print $2}')
)

all_running=true
for bot in "${!bot_pids[@]}"; do
    pid=${bot_pids[$bot]}
    if [ -n "$pid" ]; then
        echo -e "${GREEN}✅ $bot - RUNNING (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ $bot - NOT RUNNING${NC}"
        all_running=false
    fi
done

echo ""
if $all_running; then
    echo -e "${GREEN}✅ ALL BOTS ARE RUNNING SUCCESSFULLY!${NC}"
else
    echo -e "${YELLOW}⚠️ Some bots failed to start. Check logs above.${NC}"
fi

echo ""
echo "7. STOPPING TEST"
echo "----------------"

echo "Stopping all bots..."
pkill -f "node.*bot" 2>/dev/null || true
sleep 2

if ps -p $START_PID > /dev/null 2>&1; then
    kill $START_PID 2>/dev/null || true
fi

echo ""
echo "=== TEST COMPLETE ==="
echo ""
echo "=== MANUAL TESTING INSTRUCTIONS ==="
echo "1. Open Telegram"
echo "2. Search for: @app8x8org_bot"
echo "   - Send: /admin (should work only for you)"
echo "   - Send: /start (should work for everyone)"
echo ""
echo "3. Search for: @xorgbytm8_bot"
echo "   - Send: /start (OUT bot welcome)"
echo "   - Send: /tasks (view OUT tasks)"
echo ""
echo "4. Check email: xorgbytm8@gmail.com"
echo "   - Should receive test email"
echo "   - Check spam folder if not in inbox"
echo ""
echo "=== QUICK COMMANDS ==="
echo "Start system:  node start_bots_safe.js"
echo "Test email:    node test_email.js"
echo "Create backup: ./create_final_backup.sh"
echo ""
echo "Signature: 8x8org by FlashTM8 ⚡️"
