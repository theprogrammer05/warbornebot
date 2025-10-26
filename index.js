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

// Create a collection to store commands in the client
client.commands = new Map();

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (!command.default?.name || !command.default?.description) {
      console.warn(`⚠️ Command file ${file} is missing required properties.`);
      continue;
    }
    // Add command to the collection
    client.commands.set(command.default.name, command.default);
    // Also add to the commands array for registration
    commands.push(command.default);
    console.log(`✅ Loaded command: ${command.default.name}`);
  } catch (error) {
    console.error(`❌ Error loading command ${file}:`, error);
  }
}

// Register commands with Discord (guild-specific)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Successfully registered commands.');
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
    await interaction.reply({
      content: '❌ There was an error executing this command.',
      ephemeral: true
    });
  }
});

// Automatic daily schedule posting (CST-based)
client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  const scheduleFile = path.join(process.cwd(), 'schedule.json');
  if (!fs.existsSync(scheduleFile)) {
    console.warn('⚠️ schedule.json not found. Automatic posting disabled.');
    return;
  }

  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Helper to convert current UTC time to CST (UTC-6)
  const getCSTDate = () => {
    const now = new Date();
    // get UTC milliseconds, then offset by -6 hours
    const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMillis - 6 * 60 * 60 * 1000);
  };

  // Helper to post today's and tomorrow's events
  const postDailySchedule = async () => {
    try {
      const now = getCSTDate();
      const todayIndex = now.getDay();
      const tomorrowIndex = (todayIndex + 1) % 7;

      const today = daysOfWeek[todayIndex];
      const tomorrow = daysOfWeek[tomorrowIndex];
      const todayEvent = schedule[today];
      const tomorrowEvent = schedule[tomorrow];

      const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(console.error);
      if (!channel) {
        console.error('❌ Could not find announcement channel.');
        return;
      }

      let message = `📅 **${today}'s Event:** ${todayEvent ?? 'No event scheduled.'}`;
      if (tomorrowEvent) {
        message += `\n➡️ **Next Event (${tomorrow}):** ${tomorrowEvent}`;
      }

      await channel.send(message);
      console.log(`✅ Posted schedule for ${today} (CST)`);
    } catch (err) {
      console.error('❌ Error posting schedule:', err);
    }
  };

  // Calculate time until next midnight CST
  const now = getCSTDate();
  const nextMidnightCST = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 5
  );
  const millisUntilMidnight = nextMidnightCST - now;

  console.log(
    `🕒 Next schedule post in ${Math.round(millisUntilMidnight / 1000 / 60)} minutes (CST).`
  );

  // Schedule first post at next midnight CST
  setTimeout(() => {
    postDailySchedule(); // Run once at midnight CST
    setInterval(postDailySchedule, 24 * 60 * 60 * 1000); // Then every 24h
  }, millisUntilMidnight);
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
