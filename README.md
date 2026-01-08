# 8x8org Bot Ecosystem

A Telegram bot ecosystem for managing airdrops, user interactions, and admin controls.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your tokens
4. Start the ecosystem: `./manage_ecosystem.sh start`

## Bot Structure
- `bots/main_bot/` - Main application bot
- `bots/airdrop_bot/` - Airdrop management bot
- `bots/in_bot/` - Inbound message handling
- `bots/out_bot/` - Outbound notifications

## Environment Variables
See `.env.example` for required configuration.
