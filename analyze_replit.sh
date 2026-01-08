#!/bin/bash

# ============================================
# REPLIT PROJECT COMPLETE ANALYSIS SCRIPT
# Captures EVERYTHING about your current setup
# ============================================

echo "🔍 COMPLETE REPLIT PROJECT ANALYSIS"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Working directory: $(pwd)"
echo ""

# Create analysis directory
ANALYSIS_DIR="replit_analysis_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ANALYSIS_DIR"

# Function to safely read files (hides sensitive values)
safe_cat() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "=== $(basename "$file") ==="
        # Hide sensitive values but keep structure
        sed -E 's/(=|\s+)([A-Za-z0-9_\-]{20,})/\1[REDACTED]/g; 
                s/(api[_-]?key|token|secret|password|private[_-]?key)=.*/\1=[REDACTED]/gi' "$file"
        echo ""
    fi
}

# Function to capture file with header
capture_file() {
    local file="$1"
    local dest="$2"
    if [ -f "$file" ]; then
        echo "=== FILE: $file ===" > "$dest"
        cat "$file" >> "$dest"
        echo "" >> "$dest"
        echo "" >> "$dest"
    fi
}

echo "📊 1. SYSTEM INFORMATION"
echo "========================"
{
    echo "OS: $(uname -a)"
    echo "Shell: $SHELL"
    echo "Node: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
    echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"
    echo ""
} | tee "$ANALYSIS_DIR/1_system_info.txt"

echo "📁 2. COMPLETE DIRECTORY STRUCTURE"
echo "==================================="
{
    echo "FULL TREE STRUCTURE:"
    echo "-------------------"
    if command -v tree &> /dev/null; then
        tree -a -I '.git|node_modules|__pycache__|.env' --dirsfirst
    else
        find . -type d | sed -e "s/[^-][^\/]*\//  |/g" -e "s/|\([^ ]\)/|-\1/"
    fi
    echo ""
    
    echo "DETAILED FILE LISTING:"
    echo "----------------------"
    ls -la
    echo ""
    
    echo "BY FILE TYPE:"
    echo "------------"
    echo "JavaScript/TypeScript files:"
    find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | head -30
    echo ""
    
    echo "JSON files:"
    find . -type f -name "*.json"
    echo ""
    
    echo "Configuration files:"
    find . -type f -name ".*" -o -name "*config*" | grep -v ".git"
    echo ""
} | tee "$ANALYSIS_DIR/2_directory_structure.txt"

echo "📦 3. PACKAGE & DEPENDENCY ANALYSIS"
echo "===================================="
{
    echo "PACKAGE.JSON:"
    echo "-------------"
    if [ -f "package.json" ]; then
        cat package.json
        echo ""
        
        echo "INSTALLED DEPENDENCIES:"
        echo "----------------------"
        npm list --depth=0 2>/dev/null || echo "Could not list dependencies"
        echo ""
        
        echo "GLOBAL PACKAGES:"
        echo "---------------"
        npm list -g --depth=0 2>/dev/null || echo "Could not list global packages"
        echo ""
    else
        echo "No package.json found"
    fi
    
    if [ -f "requirements.txt" ]; then
        echo "PYTHON REQUIREMENTS:"
        echo "-------------------"
        cat requirements.txt
        echo ""
    fi
    
    if [ -f "Pipfile" ]; then
        echo "PIPFILE:"
        echo "--------"
        cat Pipfile
        echo ""
    fi
    
    if [ -f "Cargo.toml" ]; then
        echo "CARGO.TOML:"
        echo "-----------"
        cat Cargo.toml
        echo ""
    fi
} | tee "$ANALYSIS_DIR/3_dependencies.txt"

echo "⚙️ 4. CONFIGURATION FILES"
echo "=========================="
{
    # Capture all config files
    for config in .replit replit.nix .env .env.example .gitignore .eslintrc .prettierrc \
                  tsconfig.json jsconfig.json package-lock.json yarn.lock \
                  docker-compose.yml Dockerfile .dockerignore; do
        if [ -f "$config" ]; then
            echo "=== $config ==="
            if [[ "$config" == *.env* ]]; then
                # Hide sensitive values
                safe_cat "$config"
            else
                cat "$config"
            fi
            echo ""
            capture_file "$config" "$ANALYSIS_DIR/config_$(echo $config | sed 's/^\.//').txt"
        fi
    done
} | tee "$ANALYSIS_DIR/4_configuration.txt"

echo "💻 5. SOURCE CODE ANALYSIS"
echo "=========================="
{
    echo "MAIN ENTRY POINTS:"
    echo "-----------------"
    for entry in index.js index.ts main.js main.ts app.js app.ts server.js server.ts \
                 src/index.js src/index.ts src/main.js src/main.ts; do
        if [ -f "$entry" ]; then
            echo "=== $entry ==="
            head -50 "$entry"
            echo "..."
            echo ""
            capture_file "$entry" "$ANALYSIS_DIR/entry_$(basename $entry).txt"
        fi
    done
    
    echo "SOURCE FILE STATISTICS:"
    echo "----------------------"
    echo "Total JS/TS files: $(find . -type f \( -name "*.js" -o -name "*.ts" \) | wc -l)"
    echo "Total lines of JS/TS code: $(find . -type f \( -name "*.js" -o -name "*.ts" \) -exec cat {} \; | wc -l)"
    echo ""
    
    echo "TOP 10 LARGEST SOURCE FILES:"
    echo "---------------------------"
    find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
        -exec wc -l {} \; | sort -rn | head -10
    echo ""
    
    echo "IMPORT ANALYSIS:"
    echo "---------------"
    echo "Most common imports in JS/TS files:"
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -h "import\|require" {} \; | \
        sort | uniq -c | sort -rn | head -20
    echo ""
} | tee "$ANALYSIS_DIR/5_source_analysis.txt"

echo "🤖 6. BOT-SPECIFIC ANALYSIS"
echo "============================"
{
    echo "SEARCHING FOR BOT-RELATED FILES:"
    echo "-------------------------------"
    
    # Look for bot-related files
    find . -type f \( -iname "*bot*" -o -iname "*discord*" -o -iname "*wallet*" \
                     -o -iname "*nft*" -o -iname "*crypto*" -o -iname "*blockchain*" \
                     -o -iname "*web3*" -o -iname "*ethereum*" \) | while read file; do
        echo "Found: $file"
        if [[ "$file" == *.js ]] || [[ "$file" == *.ts ]] || [[ "$file" == *.json ]]; then
            echo "First 30 lines:"
            head -30 "$file"
            echo "..."
            echo ""
            capture_file "$file" "$ANALYSIS_DIR/bot_$(basename $file).txt"
        fi
    done
    
    echo "BOT COMMANDS IN PACKAGE.JSON:"
    echo "----------------------------"
    if [ -f "package.json" ]; then
        grep -A 10 -B 2 '"scripts"' package.json | grep -E "bot|discord|wallet|nft|crypto"
    fi
    echo ""
} | tee "$ANALYSIS_DIR/6_bot_analysis.txt"

echo "🔧 7. BUILD & RUN CONFIGURATION"
echo "================================"
{
    echo "REPLIT RUN CONFIGURATION:"
    echo "-------------------------"
    if [ -f ".replit" ]; then
        grep -A 5 -B 5 "run\|command\|language" .replit
    fi
    
    echo ""
    echo "NPM SCRIPTS:"
    echo "-----------"
    if [ -f "package.json" ]; then
        grep -A 20 '"scripts"' package.json
    fi
    
    echo ""
    echo "STARTUP FILES:"
    echo "-------------"
    find . -type f -name "start*" -o -name "run*" -o -name "init*" | head -10
    echo ""
} | tee "$ANALYSIS_DIR/7_build_config.txt"

echo "📈 8. PROJECT METRICS"
echo "======================"
{
    echo "PROJECT SIZE:"
    echo "------------"
    du -sh . 2>/dev/null || echo "Could not calculate size"
    echo ""
    
    echo "FILE TYPE DISTRIBUTION:"
    echo "----------------------"
    find . -type f | sed -e 's/.*\.//' | sort | uniq -c | sort -rn | head -15
    echo ""
    
    echo "RECENT MODIFICATIONS:"
    echo "-------------------"
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.json" | \
        xargs ls -lt 2>/dev/null | head -10
    echo ""
} | tee "$ANALYSIS_DIR/8_project_metrics.txt"

echo "🔗 9. EXTERNAL DEPENDENCIES & IMPORTS"
echo "======================================"
{
    echo "EXTERNAL IMPORTS DETECTED:"
    echo "-------------------------"
    
    # Check all JS/TS files for imports
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -h "^import\|^require\|from '" {} \; | \
        grep -v "\./" | grep -v "'\./" | sort | uniq | head -30
    
    echo ""
    echo "POTENTIAL API ENDPOINTS:"
    echo "-----------------------"
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -h "fetch\|axios\|\.get\|\.post" {} \; | \
        head -20
    
    echo ""
    echo "ENVIRONMENT VARIABLES USED:"
    echo "--------------------------"
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -h "process\.env\|process\.env\." {} \; | \
        sort | uniq | head -20
} | tee "$ANALYSIS_DIR/9_external_deps.txt"

echo "📄 10. COMPLETE FILE LISTING WITH CONTENT"
echo "=========================================="
{
    echo "ALL FILES WITH BASIC CONTENT:"
    echo "============================="
    
    # Create comprehensive file listing
    find . -type f ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.log" | \
        sort | while read file; do
        echo ""
        echo "=== FILE: $file ==="
        echo "Size: $(wc -c < "$file" 2>/dev/null || echo 0) bytes"
        echo "Lines: $(wc -l < "$file" 2>/dev/null || echo 0)"
        
        # Show first 10 lines for text files
        if [[ "$file" == *.js ]] || [[ "$file" == *.ts ]] || [[ "$file" == *.json ]] || \
           [[ "$file" == *.md ]] || [[ "$file" == *.txt ]] || [[ "$file" == *.yml ]] || \
           [[ "$file" == *.yaml ]] || [[ "$file" == *.xml ]] || [[ "$file" == *.html ]] || \
           [[ "$file" == *.css ]] || [[ "$file" == *.py ]] || [[ "$file" == *.sh ]] || \
           [[ "$file" == *.rs ]] || [[ "$file" == *.go ]]; then
            echo "--- First 10 lines ---"
            head -10 "$file" 2>/dev/null || echo "(Cannot read)"
        else
            echo "(Binary or unsupported format)"
        fi
        echo "========================"
    done | head -1000  # Limit output
} | tee "$ANALYSIS_DIR/10_complete_listing.txt"

echo "🎯 11. SPECIALIZED BOT DETECTION"
echo "================================"
{
    echo "DISCORD.JS DETECTION:"
    echo "-------------------"
    if [ -f "package.json" ]; then
        grep -i "discord" package.json
    fi
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -l "discord\|Client\|Message\|SlashCommand" {} \; | head -10
    
    echo ""
    echo "WEB3/ETHERS DETECTION:"
    echo "--------------------"
    if [ -f "package.json" ]; then
        grep -i "web3\|ethers\|web3.js" package.json
    fi
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -l "web3\|ethers\|Contract\|Provider" {} \; | head -10
    
    echo ""
    echo "DATABASE DETECTION:"
    echo "-----------------"
    if [ -f "package.json" ]; then
        grep -i "mongoose\|sequelize\|prisma\|typeorm\|mongodb\|postgres" package.json
    fi
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -l "mongoose\|Schema\|Model\|sequelize" {} \; | head -10
    
    echo ""
    echo "API SERVER DETECTION:"
    echo "-------------------"
    if [ -f "package.json" ]; then
        grep -i "express\|fastify\|koa\|hapi" package.json
    fi
    find . -type f \( -name "*.js" -o -name "*.ts" \) -exec grep -l "express\|app\.get\|app\.post\|Router" {} \; | head -10
} | tee "$ANALYSIS_DIR/11_bot_detection.txt"

echo "📋 12. CREATE SUMMARY REPORT"
echo "============================"
{
    echo "COMPREHENSIVE PROJECT SUMMARY"
    echo "============================="
    echo ""
    echo "PROJECT OVERVIEW:"
    echo "----------------"
    echo "Location: $(pwd)"
    echo "Analysis date: $(date)"
    echo "Total files analyzed: $(find . -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)"
    echo ""
    
    echo "TECH STACK DETECTED:"
    echo "------------------"
    # Detect tech stack
    if [ -f "package.json" ]; then
        echo "✓ Node.js/JavaScript project"
        if grep -q "typescript" package.json; then
            echo "✓ TypeScript detected"
        fi
        if grep -q "react" package.json; then
            echo "✓ React detected"
        fi
        if grep -q "discord.js" package.json; then
            echo "✓ Discord.js bot detected"
        fi
        if grep -q "ethers\|web3" package.json; then
            echo "✓ Web3/Blockchain detected"
        fi
        if grep -q "express" package.json; then
            echo "✓ Express.js server detected"
        fi
        if grep -q "mongoose" package.json; then
            echo "✓ MongoDB/Mongoose detected"
        fi
    fi
    
    if [ -f "requirements.txt" ]; then
        echo "✓ Python project"
    fi
    
    if [ -f "Cargo.toml" ]; then
        echo "✓ Rust project"
    fi
    
    echo ""
    echo "ARCHITECTURE PATTERNS:"
    echo "--------------------"
    if [ -d "src/bots" ] || [ -d "src/discord" ]; then
        echo "✓ Bot architecture detected"
    fi
    
    if [ -d "src/api" ] || [ -d "routes" ]; then
        echo "✓ API architecture detected"
    fi
    
    if [ -d "src/database" ] || [ -d "models" ] || [ -d "schemas" ]; then
        echo "✓ Database layer detected"
    fi
    
    echo ""
    echo "RECOMMENDATIONS FOR MIGRATION:"
    echo "----------------------------"
    echo "1. Review the full analysis files in: $ANALYSIS_DIR/"
    echo "2. Check for any hardcoded secrets in source files"
    echo "3. Note the current folder structure and dependencies"
    echo "4. Identify entry points and main modules"
    echo "5. Check for any Replit-specific configurations"
    echo ""
} | tee "$ANALYSIS_DIR/12_summary.txt"

echo "📁 13. ARCHIVE ALL ANALYSIS FILES"
echo "=================================="
{
    # Create archive of all analysis files
    tar -czf "replit_analysis_$(date +%Y%m%d_%H%M%S).tar.gz" "$ANALYSIS_DIR" 2>/dev/null || \
        zip -r "replit_analysis_$(date +%Y%m%d_%H%M%S).zip" "$ANALYSIS_DIR"
    
    echo "✅ Analysis complete!"
    echo "📊 Reports generated in: $ANALYSIS_DIR/"
    echo "📦 Archive created: replit_analysis_*.tar.gz/zip"
    echo ""
    echo "📋 SUMMARY OF CAPTURED DATA:"
    echo "============================="
    echo "1. System information"
    echo "2. Complete directory structure"
    echo "3. All dependencies (package.json, requirements.txt, etc.)"
    echo "4. All configuration files (.replit, .env*, tsconfig, etc.)"
    echo "5. Source code analysis with file statistics"
    echo "6. Bot-specific file detection"
    echo "7. Build and run configurations"
    echo "8. Project metrics and file distribution"
    echo "9. External dependencies and API usage"
    echo "10. Complete file listing with content previews"
    echo "11. Specialized bot framework detection"
    echo "12. Comprehensive summary and recommendations"
    echo ""
    echo "🔍 TO SHARE WITH ME:"
    echo "===================="
    echo "1. Run: cat $ANALYSIS_DIR/12_summary.txt"
    echo "2. Share the archive file"
    echo "3. Or share specific analysis files as needed"
    echo ""
    echo "⚠️  IMPORTANT: Check for any sensitive data before sharing!"
} | tee "$ANALYSIS_DIR/13_final_notes.txt"

# Create a quick view file
cat "$ANALYSIS_DIR/12_summary.txt" > "QUICK_VIEW.txt"
echo "" >> "QUICK_VIEW.txt"
echo "For full details, see files in $ANALYSIS_DIR/" >> "QUICK_VIEW.txt"

echo ""
echo "✨ ANALYSIS COMPLETE!"
echo "========================"
echo "Quick view saved to: QUICK_VIEW.txt"
echo "Full analysis in: $ANALYSIS_DIR/"
echo "Archive: replit_analysis_*.tar.gz"
echo ""
echo "📤 Share the QUICK_VIEW.txt and any relevant analysis files with me!"