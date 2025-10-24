import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, ANNOUNCE_CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !ANNOUNCE_CHANNEL_ID) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

// Load commands dynamically
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command.default?.name || !command.default?.description) {
    console.warn(`⚠️ Command file ${file} is missing required properties.`);
    continue;
  }
  commands.push(command.default);
}

// Register commands with Discord (guild only)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Clearing old guild commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
    console.log('✅ Old guild commands cleared.');

    console.log('Registering current commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Current commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find(cmd => cmd.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

// Automatic daily announcement based on schedule.json
client.on('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);
  if (!channel) {
    console.error('❌ Announcement channel not found.');
    return;
  }

  const scheduleFile = path.join(process.cwd(), 'schedule.json');
  if (!fs.existsSync(scheduleFile)) {
    console.error('❌ schedule.json not found.');
    return;
  }

  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const message = schedule[day] || 'No events scheduled for today.';

  channel.send(`📅 **Today (${day}):** ${message}`);
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
