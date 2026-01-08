#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# PID file
PID_FILE="/tmp/8x8org_ecosystem.pid"

# Function to check if ecosystem is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start ecosystem
start() {
    echo -e "${BLUE}=== STARTING 8X8ORG ECOSYSTEM ===${NC}"
    
    if is_running; then
        echo -e "${YELLOW}⚠️  Ecosystem is already running${NC}"
        status
        return 1
    fi
    
    # Kill any stray processes
    echo "Cleaning up any stray processes..."
    pkill -f "node.*bot" 2>/dev/null || true
    sleep 2
    
    # Start ecosystem in background
    echo "Starting ecosystem..."
    node start_bots_safe.js > ecosystem.log 2>&1 &
    ECOSYSTEM_PID=$!
    
    # Save PID
    echo $ECOSYSTEM_PID > "$PID_FILE"
    
    echo -e "${GREEN}✅ Ecosystem started with PID: $ECOSYSTEM_PID${NC}"
    echo "Logs are being written to: ecosystem.log"
    
    # Wait a bit and show status
    sleep 5
    status
}

# Function to stop ecosystem
stop() {
    echo -e "${BLUE}=== STOPPING 8X8ORG ECOSYSTEM ===${NC}"
    
    if is_running; then
        pid=$(cat "$PID_FILE")
        echo "Stopping process $pid..."
        kill $pid 2>/dev/null
        
        # Wait for process to stop
        for i in {1..10}; do
            if ! ps -p "$pid" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "Force stopping..."
            kill -9 $pid 2>/dev/null
        fi
        
        rm -f "$PID_FILE"
        echo -e "${GREEN}✅ Ecosystem stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Ecosystem is not running${NC}"
    fi
    
    # Clean up any remaining processes
    pkill -f "node.*bot" 2>/dev/null || true
    sleep 2
}

# Function to restart ecosystem
restart() {
    stop
    sleep 3
    start
}

# Function to show status
status() {
    echo -e "${BLUE}=== ECOSYSTEM STATUS ===${NC}"
    
    if is_running; then
        pid=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ Ecosystem is RUNNING (PID: $pid)${NC}"
        
        # Show bot processes
        echo ""
        echo "Bot Processes:"
        echo "---------------"
        bots=("main_bot" "out_bot" "in_bot" "airdrop_bot" "wallet_bot" "nft_marketplace")
        for bot in "${bots[@]}"; do
            if ps aux | grep -q "$bot/index.js" | grep -v grep; then
                bot_pid=$(ps aux | grep "$bot/index.js" | grep -v grep | awk '{print $2}')
                echo -e "${GREEN}✅ $(echo $bot | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1') (PID: $bot_pid)${NC}"
            else
                echo -e "${RED}❌ $(echo $bot | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')${NC}"
            fi
        done
        
        # Show recent logs
        echo ""
        echo "Recent Logs:"
        echo "------------"
        tail -5 ecosystem.log 2>/dev/null || echo "No log file yet"
    else
        echo -e "${RED}❌ Ecosystem is NOT RUNNING${NC}"
    fi
}

# Function to show logs
logs() {
    echo -e "${BLUE}=== ECOSYSTEM LOGS ===${NC}"
    
    if [ -f "ecosystem.log" ]; then
        tail -50 ecosystem.log
    else
        echo "No log file found. Start the ecosystem first."
    fi
}

# Function to test individual bots
test_bot() {
    echo -e "${BLUE}=== TESTING BOT: $1 ===${NC}"
    
    case $1 in
        main)
            echo "Testing Main Bot (@app8x8org_bot)"
            echo "Commands to test in Telegram:"
            echo "  /start - Welcome message"
            echo "  /admin - Admin panel (only for owner)"
            echo "  /status - Bot status"
            ;;
        out)
            echo "Testing OUT Bot (@xorgbytm8_bot)"
            echo "Commands to test:"
            echo "  /start - OUT tasks welcome"
            echo "  /tasks - View OUT tasks"
            echo "  /status - Bot status"
            ;;
        wallet)
            echo "Testing Wallet Bot (@wallet8x8org_bot)"
            echo "Commands to test:"
            echo "  /start - Universal wallet manager"
            echo "  /networks - View all networks"
            echo "  /create ethereum - Create ETH wallet"
            echo "  /wallets - View your wallets"
            ;;
        *)
            echo "Available bots to test:"
            echo "  main    - @app8x8org_bot (Main interface)"
            echo "  out     - @xorgbytm8_bot (OUT tasks)"
            echo "  in      - @in8x8org_bot (IN tasks)"
            echo "  airdrop - @airdrop8x8org_bot (Rewards)"
            echo "  wallet  - @wallet8x8org_bot (Universal wallet)"
            echo "  nft     - NFT Bot (Coming soon)"
            ;;
    esac
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    test)
        test_bot "$2"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|test [bot]}"
        echo ""
        echo "Commands:"
        echo "  start     - Start the ecosystem"
        echo "  stop      - Stop the ecosystem"
        echo "  restart   - Restart the ecosystem"
        echo "  status    - Show ecosystem status"
        echo "  logs      - Show ecosystem logs"
        echo "  test [bot]- Test specific bot"
        echo ""
        echo "Available bots for testing:"
        echo "  main, out, in, airdrop, wallet, nft"
        echo ""
        echo "Signature: 8x8org by FlashTM8 ⚡️"
        exit 1
        ;;
esac
