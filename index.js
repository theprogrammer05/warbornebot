import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import { initializeReminders } from './utils/reminderManager.js';
import { initializeEventScheduler } from './utils/eventScheduler.js';
import { scheduleDailyPost } from './utils/dailySchedule.js';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, ANNOUNCE_CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !ANNOUNCE_CHANNEL_ID) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Map();

const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (!command.default?.name || !command.default?.description) {
      console.warn(`⚠️ Command file ${file} is missing required properties.`);
      continue;
    }
    client.commands.set(command.default.name, command.default);
    console.log(`✅ Loaded command: ${command.default.name}`);
  } catch (error) {
    console.error(`❌ Error loading command ${file}:`, error);
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    const errorMsg = { content: '❌ There was an error executing this command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('cancel_reminder_')) return;
  
  const reminderId = interaction.customId.replace('cancel_reminder_', '');
  
  try {
    const { removeReminder, loadReminders } = await import('./utils/reminderManager.js');
    const reminders = loadReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (!reminder) {
      return interaction.reply({
        content: '❌ This reminder has already been cancelled or has fired.',
        flags: MessageFlags.Ephemeral
      });
    }
    
    if (reminder.userId !== interaction.user.id) {
      return interaction.reply({
        content: '❌ You can only cancel your own reminders!',
        flags: MessageFlags.Ephemeral
      });
    }
    
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
});

client.once('clientReady', async () => {
  try {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    
    // Deploy commands on startup (only if needed - Railway redeploys trigger this)
    // Discord cache takes ~1 minute to propagate globally
    if (process.env.RAILWAY_DEPLOYMENT_ID) {
      console.log('🔄 Railway deployment detected - updating Discord commands...');
      try {
        const { execSync } = await import('child_process');
        execSync('node deploy-commands.js', { stdio: 'inherit' });
        console.log('✅ Commands deployed. Discord cache will update in ~1 minute.');
      } catch (err) {
        console.error('⚠️ Command deployment failed (non-critical):', err.message);
      }
    }

    initializeReminders(client);
    initializeEventScheduler(client);
    
    const scheduleFile = path.join(process.cwd(), 'schedule.json');
    if (fs.existsSync(scheduleFile)) {
      scheduleDailyPost(client, ANNOUNCE_CHANNEL_ID);
    } else {
      console.warn('⚠️ schedule.json not found. Automatic posting disabled.');
    }
  } catch (error) {
    console.error('❌ Error in clientReady handler:', error);
  }
});

client.login(DISCORD_TOKEN);
