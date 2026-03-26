#!/bin/bash

# Ruflo Initializer for Talkaris
# This script validates the configuration and initializes the environment.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}--- Talkaris Ruflo Initializer ---${NC}"

# 1. Check for required files
FILES=(".env.ruflo" "claude-flow.config.json" ".codex/config.toml" ".gemini/settings.json" "CLAUDE.md" "AGENTS.md" "GEMINI.md")
MISSING=()

for f in "${FILES[@]}"; do
    if [ ! -f "$f" ]; then
        MISSING+=("$f")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}[ERROR] Missing files: ${MISSING[*]}${NC}"
    exit 1
else
    echo -e "${GREEN}[OK] All configuration files found.${NC}"
fi

# 2. Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INFO] node_modules not found. Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}[OK] node_modules found.${NC}"
fi

# 3. Initialize Ruflo Directories
DIRS=(".ruflo/memory/claude" ".ruflo/memory/codex" ".ruflo/memory/gemini" "docs/rebuild")
for d in "${DIRS[@]}"; do
    mkdir -p "$d"
done
echo -e "${GREEN}[OK] Ruflo directories initialized.${NC}"

# 4. Success
echo -e "${GREEN}Ruflo is ready to orchestrate the rebuild.${NC}"
echo -e "Use 'ruflo status' to check connection (once Ruflo CLI is in path)."
echo -e "Suggested first command: ruflo run architecture-swarm --plan"
