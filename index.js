// index.js
import { Client, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

// ------------------------
// Check required environment variables
// ------------------------
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(
    '❌ Missing required environment variables. Make sure DISCORD_TOKEN, CLIENT_ID, and GUILD_ID are set in Railway Variables.'
  );
  process.exit(1);
}

// ------------------------
// Create Discord client
// ------------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ------------------------
// Define your slash commands here
// ------------------------
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'hello',
    description: 'Greets the user!',
  },
];

// ------------------------
// Register slash commands
// ------------------------
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Refreshing application (/) commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log('✅ Commands registered!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
})();

// ------------------------
// Bot event listeners
// ------------------------
client.once('ready', () =>
