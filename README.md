# WarborneBot

A Discord bot for the Warborne game community with automated scheduling, reminders, FAQ management, and research tracking.

## Features

- **📅 Daily Schedule Posting** - Automatically posts daily game events at midnight CST
- **⏰ Persistent Reminders** - Set reminders with custom mentions that survive bot restarts
- **❓ FAQ Management** - Add, edit, and retrieve frequently asked questions
- **🔬 Research Tracking** - Track and display research information
- **🎮 Command System** - Slash commands for easy interaction

## Commands

- `/wb-schedule` - Display today's game events
- `/wb-reminder` - Set a reminder with custom time and mentions
- `/wb-faq` - View, add, edit, or delete FAQ entries
- `/wb-research` - View research information
- `/wb-commands` - List all available commands

## Setup

### Prerequisites

- Node.js 18+ or Python 3.8+
- Discord Bot Token
- GitHub Personal Access Token (for data persistence)

### Environment Variables

Create a `.env` file with:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_guild_id
ANNOUNCE_CHANNEL_ID=channel_for_daily_posts
GITHUB_TOKEN=your_github_token
GITHUB_REPO=username/repo
GITHUB_USER=your_github_username
BRANCH=main
```

### Installation

```bash
# Install dependencies
npm install

# Deploy slash commands
node index.js

# Run the bot
npm start
```

## Deployment

This bot is configured for Railway deployment:

1. Push to GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway
4. Deploy automatically

**Note:** `railway.toml` is configured to ignore JSON data files to prevent unnecessary redeployments.

## Data Persistence

All data is stored in JSON files and synced to GitHub:

- `reminders.json` - Active reminders
- `faq.json` - FAQ entries
- `schedule.json` - Daily event schedule
- `research.json` - Research information

Data survives bot restarts by syncing to GitHub and loading on startup.

## Architecture

- **index.js** - Main bot entry point, command handler, and schedule posting
- **commands/** - Slash command implementations
- **utils/** - Helper utilities (GitHub sync, reminder manager)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use and modify for your community!
