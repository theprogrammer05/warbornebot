import { Client, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import fs from 'fs';
import path from 'path';

// ------------------------
// Check environment variables
// ------------------------
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

console.log('DISCORD_TOKEN:', DISCORD_TOKEN ? 'SET' : 'NOT SET');
console.log('CLIENT_ID:', CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GUILD_ID:', GUILD_ID ? 'SET' : 'NOT SET');

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing required environment variables. Bot will not register commands.');
  // Don't exit, just prevent registration for now
}

// ------------------------
// Client
// ------------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ------------------------
// Load commands dynamically
// ------------------------
const commandsPath = path.resolve('./commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))
  : [];

const commands = [];
const commandMap = new Map();

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  commands.push({ name: command.default.name, description: command.default.description });
  commandMap.set(command.default.name, command.default.execute);
}

console.log('Loaded commands:', commands.map(c => c.name));

// ------------------------
// Register commands with Discord (only if env variables exist)
// ------------------------
if (DISCORD_TOKEN && CLIENT_ID && GUILD_ID) {
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
}

// ------------------------
// Interaction handler
// ------------------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandExecute = commandMap.get(interaction.commandName);
  if (!commandExecute) {
    await interaction.reply('Unknown command!');
    return;
  }

  try {
    await commandExecute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply('❌ Failed to respond to the command.');
      } catch (e) {
        console.error('Failed to send fallback reply:', e);
      }
    }
  }
});

// ------------------------
// Login
// ------------------------
if (DISCORD_TOKEN) {
  client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  client.login(DISCORD_TOKEN).catch((err) => {
    console.error('Failed to login, check DISCORD_TOKEN:', err);
  });
} else {
  console.warn('⚠️ DISCORD_TOKEN not set. Bot will not login.');
}
