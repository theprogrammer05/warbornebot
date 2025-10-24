import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import cron from 'node-cron';
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

// Register slash commands with Discord (guild-based)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Map /price to include input option
    const formattedCommands = commands.map(cmd => {
      if (cmd.name === 'price') {
        return {
          ...cmd,
          options: [
            {
              name: 'numbers',
              type: 3, // STRING
              description: 'Starfall Token Cost For Equipment, Starfall Token Chest Cost, Solarbite Cost (for Chest). Example: "5m 340k 30"',
              required: true
            }
          ]
        };
      }
      return cmd;
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

// Handle slash command interactions
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

// --- Cron Jobs Setup ---
const cronJobs = [];

// Function to start daily schedule announcement
function startDailySchedule() {
  // Runs every day at 9:00 AM server time
  const job = cron.schedule('0 9 * * *', async () => {
    try {
      const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);
      if (!channel) return console.error('❌ Announcement channel not found.');

      const scheduleFile = path.join(process.cwd(), 'schedule.json');
      if (!fs.existsSync(scheduleFile)) return;

      const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
      const today = new Date();
      const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
      const event = schedule[weekday];

      if (event) {
        await channel.send(`📅 **${weekday}**: ${event}`);
      }
    } catch (err) {
      console.error('❌ Error in daily schedule cron job:', err);
    }
  });

  cronJobs.push(job);
  console.log('✅ Daily schedule cron job started.');
}

// Start cron jobs once the bot is ready
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  startDailySchedule();
});

// --- Cron Job Management Commands (via interaction) ---
commands.push({
  name: 'list-cron',
  description: 'List all active cron jobs.',
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    }
    const lines = cronJobs.map((job, idx) => `${idx + 1}. ${job.running ? '✅ Running' : '❌ Stopped'}`);
    await interaction.reply({ content: lines.join('\n') || 'No cron jobs.', ephemeral: false });
  },
});

commands.push({
  name: 'clear-cron',
  description: 'Stop all cron jobs.',
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    }
    cronJobs.forEach(job => job.stop());
    await interaction.reply({ content: '✅ All cron jobs stopped.', ephemeral: false });
  },
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
