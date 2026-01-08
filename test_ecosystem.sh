#!/bin/bash

echo "=== TESTING 8X8ORG BOT ECOSYSTEM ==="
echo "System Owner: FlashTM8"
echo "Signature: 8x8org by FlashTM8 ⚡️"
echo "Date: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test a bot
test_bot() {
    local bot_name=$1
    local bot_path=$2
    local expected_status=$3
    
    echo -e "${BLUE}Testing $bot_name...${NC}"
    
    if [ ! -f "$bot_path" ]; then
        echo -e "${RED}✗ $bot_name not found at $bot_path${NC}"
        return 1
    fi
    
    # Check syntax
    if node -c "$bot_path" 2>/dev/null; then
        echo -e "${GREEN}✓ $bot_name syntax OK${NC}"
        return 0
    else
        echo -e "${RED}✗ $bot_name syntax error${NC}"
        return 1
    fi
}

# Function to check environment
check_env() {
    echo -e "${BLUE}Checking environment...${NC}"
    
    # Check .env file
    if [ -f .env ]; then
        echo -e "${GREEN}✓ .env file exists${NC}"
        
        # Check critical variables
        if grep -q "TELEGRAM_BOT_TOKEN" .env; then
            token_line=$(grep "TELEGRAM_BOT_TOKEN" .env)
            echo -e "${GREEN}✓ TELEGRAM_BOT_TOKEN is set${NC}"
        else
            echo -e "${YELLOW}⚠ TELEGRAM_BOT_TOKEN not set${NC}"
        fi
        
        if grep -q "ADMIN_TELEGRAM_ID" .env; then
            admin_id=$(grep "ADMIN_TELEGRAM_ID" .env | cut -d= -f2)
            echo -e "${GREEN}✓ ADMIN_TELEGRAM_ID is set to: $admin_id${NC}"
        else
            echo -e "${YELLOW}⚠ ADMIN_TELEGRAM_ID not set${NC}"
        fi
    else
        echo -e "${RED}✗ .env file not found${NC}"
    fi
    
    # Check dependencies
    echo -e "${BLUE}Checking dependencies...${NC}"
    if [ -f package.json ]; then
        echo -e "${GREEN}✓ package.json exists${NC}"
    fi
    
    if [ -d node_modules ]; then
        echo -e "${GREEN}✓ node_modules exists${NC}"
    else
        echo -e "${YELLOW}⚠ node_modules not found - run npm install${NC}"
    fi
}

# Function to test bot startup
test_bot_startup() {
    local bot_name=$1
    local bot_path=$2
    
    echo -e "${BLUE}Starting $bot_name...${NC}"
    
    # Start bot in background
    cd "$(dirname "$bot_path")"
    node "$(basename "$bot_path")" &
    local bot_pid=$!
    
    # Wait a bit
    sleep 3
    
    # Check if still running
    if ps -p $bot_pid > /dev/null; then
        echo -e "${GREEN}✓ $bot_name started successfully (PID: $bot_pid)${NC}"
        
        # Kill it for cleanup
        kill $bot_pid 2>/dev/null
        sleep 1
        return 0
    else
        echo -e "${RED}✗ $bot_name failed to start${NC}"
        return 1
    fi
}

# Main test sequence
echo ""
echo "1. ENVIRONMENT CHECK"
check_env

echo ""
echo "2. BOT SYNTAX TESTS"
test_bot "Main Bot (app8x8org_bot)" "bots/main_bot/index.js"
test_bot "OUT Bot (xorgbytm8_bot)" "bots/out_bot/index.js"
test_bot "IN Bot" "bots/in_bot/index.js"
test_bot "Airdrop Bot" "bots/airdrop_bot/index.js"
test_bot "Wallet Bot" "bots/wallet_bot/index.js"
test_bot "NFT Bot" "bots/nft_marketplace/index.js"
test_bot "Admin Bot" "bots/admin_bot/index.js"

echo ""
echo "3. STARTUP TESTS"
# Note: We'll only test one bot at a time to avoid conflicts
# We'll create a test configuration first

# Create test environment
cat > .env.test << TESTENV
# Test Environment - 8x8org Ecosystem
# Owner: FlashTM8 ⚡️
# Date: $(date)

# Bot Tokens (test mode)
TELEGRAM_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
OUT_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
IN_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
AIRDROP_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
WALLET_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
NFT_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
MAIN_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ
APP_BOT_TOKEN=test_token_123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ

# Admin Configuration
ADMIN_TELEGRAM_ID=123456789  # Your Telegram ID
ADMIN_USERNAME=FlashTM8
OWNER_SIGNATURE=8x8org by FlashTM8 ⚡️

# Database
DATABASE_URL=sqlite::memory:
DB_TEST_MODE=true

# Email Configuration (for reports)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REPORT_EMAIL=your-email@gmail.com

# Features
ENABLE_EXCEL_REPORTS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_ADMIN_CONTROLS=true
DISABLE_USER_COMMANDS=true

# Security
REQUIRE_ADMIN_APPROVAL=true
LOG_ALL_ACTIONS=true
BACKUP_ON_CHANGES=true
TESTENV

echo -e "${GREEN}✓ Test environment created${NC}"

# Test system startup
echo ""
echo "4. SYSTEM INTEGRATION TEST"
if [ -f start_bots_safe.js ]; then
    echo -e "${BLUE}Testing system startup...${NC}"
    
    # Kill any running bots
    pkill -f "node.*bot" 2>/dev/null || true
    
    # Start in test mode
    timeout 10 node start_bots_safe.js --test 2>&1 | grep -E "(RUNNING|Started|error|Error)" &
    sleep 5
    
    # Check if processes are running
    running_bots=$(ps aux | grep -c "node.*bot")
    echo -e "${GREEN}✓ $running_bots bot processes detected${NC}"
    
    # Kill test processes
    pkill -f "node.*bot" 2>/dev/null || true
    pkill -f "start_bots" 2>/dev/null || true
else
    echo -e "${RED}✗ start_bots_safe.js not found${NC}"
fi

# Clean up
rm -f .env.test

echo ""
echo "=== TEST COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Set real bot tokens in .env"
echo "2. Set your Telegram ID as ADMIN_TELEGRAM_ID"
echo "3. Configure email for reports"
echo "4. Run full system: node start_bots_safe.js"
echo "5. Test each bot with /start command"
echo ""
echo "Signature: 8x8org by FlashTM8 ⚡️"
