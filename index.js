import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, ANNOUNCE_CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

if (!ANNOUNCE_CHANNEL_ID) {
  console.warn('⚠️ ANNOUNCE_CHANNEL_ID not set — daily schedule will be disabled.');
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

// Register commands with Discord
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    const formattedCommands = commands.map(cmd => {
      switch (cmd.name) {
        case 'price':
          return {
            ...cmd,
            description: 'Calculates Solarbite break-even value',
            options: [
              {
                name: 'numbers',
                type: 3, // STRING
                description: 'Equip cost / Chest cost / Solarbite cost',
                required: true
              }
            ]
          };
        case 'faq':
          return {
            ...cmd,
            description: 'View or update FAQ entries'
          };
        case 'season-start':
          return {
            ...cmd,
            description: 'Set the start date for the season'
          };
        case 'flow-diagram':
          return {
            ...cmd,
            description: 'Shows a flow diagram for bot commands'
          };
        case 'schedule':
          return {
            ...cmd,
            description: 'View the current schedule for daily events'
          };
        default:
          return {
            ...cmd,
            description: cmd.description?.slice(0, 100) || 'No description'
          };
      }
    });

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: formattedCommands }
    );

    console.log('✅ Successfully registered commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// Handle interactions
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

// Daily schedule
if (ANNOUNCE_CHANNEL_ID) {
  cron.schedule('0 0 * * *', async () => { // Every day at midnight
    try {
      const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);
      if (!channel) return console.warn('⚠️ ANNOUNCE_CHANNEL_ID invalid');

      // Load schedule from JSON file
      const schedulePath = path.join(process.cwd(), 'schedule.json');
      if (!fs.existsSync(schedulePath)) return;

      const scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' });

      if (scheduleData[dayName]) {
        await channel.send(`📅 **${dayName} Schedule:**\n${scheduleData[dayName]}`);
      }
    } catch (err) {
      console.error('❌ Error sending daily schedule:', err);
    }
  });

  console.log('✅ Daily schedule cron job started.');
}

client.login(DISCORD_TOKEN).then(() => console.log(`✅ Bot logged in as ${client.user.tag}`));
