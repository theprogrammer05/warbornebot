import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import 'dotenv/config';

// Check required environment variables
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing required environment variables. Bot will not register commands.');
  process.exit(1);
}

// Create Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load commands
const commands = [];
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join('./commands', file);
  const command = await import(filePath);
  if (!command.default?.data || !command.default?.execute) {
    console.log(`⚠️ Command file ${file} is missing required properties.`);
    continue;
  }
  client.commands.set(command.default.data.name, command.default);
  commands.push(command.default.data.toJSON());
}

console.log(`✅ Loaded commands: ${[...client.commands.keys()]}`);

// Register commands with Discord (guild-specific for faster updates)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

// Command handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);
