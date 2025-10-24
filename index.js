import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

// Load commands
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  if (!cmd.default?.name || !cmd.default?.description) continue;
  commands.push(cmd.default);
}

// Register with Discord
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const formatted = commands.map(cmd => cmd.subcommands ? { name: cmd.name, description: cmd.description, options: cmd.subcommands } : cmd);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: formatted });
    console.log('✅ Commands registered.');
  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
})();

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commands.find(c => c.name === interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
  }
});

client.login(DISCORD_TOKEN).then(() => console.log(`✅ Bot logged in as ${client.user.tag}`));
