import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import { initializeReminders } from './utils/reminderManager.js';
import { initializeEventScheduler } from './utils/eventScheduler.js';
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
    console.log(`✅ Loaded command: ${command.default.name}`);
  } catch (error) {
    console.error(`❌ Error loading command ${file}:`, error);
  }
}

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ There was an error executing this command.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ There was an error executing this command.',
        ephemeral: true
      });
    }
  }
});

// Handle button interactions (e.g., cancel reminder)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  
  // Handle cancel reminder button
  if (interaction.customId.startsWith('cancel_reminder_')) {
    const reminderId = interaction.customId.replace('cancel_reminder_', '');
    
    try {
      const { removeReminder, loadReminders } = await import('./utils/reminderManager.js');
      
      // Check if reminder exists
      const reminders = loadReminders();
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        return interaction.reply({
          content: '❌ This reminder has already been cancelled or has fired.',
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Check if user owns this reminder
      if (reminder.userId !== interaction.user.id) {
        return interaction.reply({
          content: '❌ You can only cancel your own reminders!',
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Remove the reminder
      await removeReminder(reminderId);
      
      await interaction.reply({
        content: 
          `✅ **Reminder Cancelled!**\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📢 **Cancelled:** ${reminder.description}`,
        flags: MessageFlags.Ephemeral
      });
      
      console.log(`🗑️ User ${interaction.user.tag} cancelled reminder ${reminderId}`);
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      await interaction.reply({
        content: '❌ An error occurred while cancelling the reminder.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

// Automatic daily schedule posting (CST-based)
client.once('clientReady', async () => {
  try {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    // Initialize reminder system
    initializeReminders(client);
    
    // Initialize event scheduler
    initializeEventScheduler(client);

    const scheduleFile = path.join(process.cwd(), 'schedule.json');
    if (!fs.existsSync(scheduleFile)) {
      console.warn('⚠️ schedule.json not found. Automatic posting disabled.');
      return;
    }

  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Helper to convert current UTC time to Central Time (handles CST/CDT automatically)
  const getCentralTime = () => {
    // Use Intl.DateTimeFormat to properly handle CST/CDT
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  };

  // Helper to post today's and tomorrow's events
  const postDailySchedule = async () => {
    try {
      const now = getCentralTime();
      const todayIndex = now.getDay();
      const tomorrowIndex = (todayIndex + 1) % 7;

      const today = daysOfWeek[todayIndex];
      const tomorrow = daysOfWeek[tomorrowIndex];
      const todayEvents = schedule[today] || [];
      const tomorrowEvents = schedule[tomorrow] || [];

      const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(console.error);
      if (!channel) {
        console.error('❌ Could not find announcement channel.');
        return;
      }

      // Day emoji mapping (themed to match daily events)
      const dayEmojis = {
        'Sunday': '♻️',      // Double Scrap Post (recycling/scrap)
        'Monday': '🏆',      // 100% Harvest Vault Experience & Chest Rewards
        'Tuesday': '⚡',     // Exergy Event (energy)
        'Wednesday': '📈',   // 50% Experience (growth/leveling up)
        'Thursday': '☢️',    // Radiation Storm
        'Friday': '⚔️',      // Faction Contribution from PVP (combat)
        'Saturday': '🥩'     // Protein Event (meat/protein)
      };

      // Format today's events
      let message = 
        `📅 **Daily Event Schedule**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${dayEmojis[today] || '📅'} **${today}'s Events:**\n`;
      
      if (todayEvents.length === 0) {
        message += '   • _No events scheduled_';
      } else {
        message += todayEvents.map((event, i) => {
          let eventText = `   **${i + 1}.** **Event:** ${event.name}`;
          if (event.times && event.times.length > 0) {
            eventText += `\n     **Time:** ${event.times.join(', ')} CST`;
          }
          if (event.description) {
            eventText += `\n     **Description:** ${event.description}`;
          }
          return eventText;
        }).join('\n\n');
      }

      // Format tomorrow's events
      if (tomorrowEvents.length > 0) {
        message += `\n\n${dayEmojis[tomorrow] || '📅'} **Tomorrow (${tomorrow}):**\n`;
        message += tomorrowEvents.map((event, i) => {
          let eventText = `   **${i + 1}.** **Event:** ${event.name}`;
          if (event.times && event.times.length > 0) {
            eventText += `\n     **Time:** ${event.times.join(', ')} CST`;
          }
          if (event.description) {
            eventText += `\n     **Description:** ${event.description}`;
          }
          return eventText;
        }).join('\n\n');
      }

      message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Use \`/wb-schedule view\` to see the full week!*`;

      await channel.send(message);
      console.log(`✅ Posted schedule for ${today} (Central Time)`);
      
      // Initialize event scheduler after posting the daily schedule
      initializeEventScheduler(client);
    } catch (err) {
      console.error('❌ Error posting schedule:', err);
    }
  };

  // Calculate time until next midnight Central Time
  const now = getCentralTime();
  
  // Create next midnight in Central Time
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 5, 0); // Set to midnight + 5 seconds
  
  const millisUntilMidnight = nextMidnight - now;

  console.log(
    `🕒 Next schedule post in ${Math.round(millisUntilMidnight / 1000 / 60)} minutes (Central Time).`
  );
  console.log(`📅 Current Central Time: ${now.toLocaleString('en-US', { timeZone: 'America/Chicago' })}`);
  console.log(`📅 Next post at: ${nextMidnight.toLocaleString('en-US', { timeZone: 'America/Chicago' })}`);

  // Schedule first post at next midnight Central Time
  setTimeout(() => {
    postDailySchedule(); // Run once at midnight
    setInterval(postDailySchedule, 24 * 60 * 60 * 1000); // Then every 24h
  }, millisUntilMidnight);
  } catch (error) {
    console.error('❌ Error in clientReady handler:', error);
  }
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
