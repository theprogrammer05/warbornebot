import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

// Check required environment variables
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing required environment variables. Bot will not register commands.');
  process.exit(1);
}

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load commands dynamically from commands folder
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
const commandMap = new Map();

for (const file of commandFiles) {
  const commandModule = await import(path.join(commandsPath, file));
  const command = commandModule.default;
  if (!command || !command.name || !command.execute) {
    console.warn(`⚠️ Command file ${file} is missing required properties.`);
    continue;
  }
  commands.push({ name: command.name, description: command.description || 'No description' });
  commandMap.set(command.name, command);
}

// Register commands to Discord (for this guild)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
try {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log(`✅ Successfully registered ${commands.length} commands.`);
} catch (err) {
  console.error('❌ Error registering commands:', err);
}

// Respond to interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: '❌ Command not found', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error('❌ Error executing command:', err);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

// Login bot
client.login(DISCORD_TOKEN).then(() => {
  console.log('✅ Bot logged in successfully.');
}).catch(err => {
  console.error('❌ Failed to login:', err);
});
