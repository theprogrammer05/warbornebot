import fs from 'fs';
import path from 'path';
import { updateGitHubFile } from './github.js';

const remindersFile = path.join(process.cwd(), 'reminders.json');

// Active timeouts map
const activeTimeouts = new Map();

// Load reminders from file
function loadReminders() {
  try {
    return JSON.parse(fs.readFileSync(remindersFile, 'utf8'));
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

// Save reminders to file and GitHub
async function saveReminders(reminders) {
  fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
  await updateGitHubFile('reminders.json', reminders, 'Update reminders via Discord bot');
}

// Remove a reminder from the JSON file
async function removeReminder(reminderId) {
  const reminders = loadReminders();
  const filtered = reminders.filter(r => r.id !== reminderId);
  await saveReminders(filtered);
  
  // Clear the timeout if it exists
  if (activeTimeouts.has(reminderId)) {
    clearTimeout(activeTimeouts.get(reminderId));
    activeTimeouts.delete(reminderId);
  }
}

// Schedule a single reminder
function scheduleReminder(client, reminder, silent = false) {
  const now = Date.now();
  const timeUntilTrigger = reminder.triggerTime - now;
  
  // Skip if reminder is in the past
  if (timeUntilTrigger <= 0) {
    console.log(`⏭️ Skipping expired reminder: ${reminder.id}`);
    removeReminder(reminder.id); // Clean up expired reminder
    return;
  }
  
  // Skip if reminder is too far in the future (more than 30 days)
  if (timeUntilTrigger > 30 * 24 * 60 * 60 * 1000) {
    console.log(`⏭️ Skipping reminder too far in future: ${reminder.id}`);
    return;
  }
  
  console.log(`⏰ ${silent ? 'Silently scheduling' : 'Scheduling'} reminder ${reminder.id} in ${Math.round(timeUntilTrigger / 1000 / 60)} minutes`);
  
  const timeout = setTimeout(async () => {
    try {
      // Fetch the channel
      const channel = await client.channels.fetch(reminder.channelId).catch(console.error);
      if (!channel) {
        console.error(`❌ Could not find channel ${reminder.channelId} for reminder ${reminder.id}`);
        await removeReminder(reminder.id);
        return;
      }
      
      // Determine who to mention (use mentionString if available, otherwise fall back to userId)
      const mentionText = reminder.mentionString || `<@${reminder.userId}>`;
      
      // Send the reminder message
      await channel.send({
        content: 
          `🔔 **REMINDER** 🔔\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${mentionText} Drifter, your reminder:\n` +
          `📢 **${reminder.description}**`
      });
      
      console.log(`✅ Fired reminder ${reminder.id}`);
      
      // Remove the reminder from the JSON file after firing
      await removeReminder(reminder.id);
    } catch (error) {
      console.error(`❌ Error firing reminder ${reminder.id}:`, error);
      await removeReminder(reminder.id);
    }
  }, timeUntilTrigger);
  
  // Store the timeout
  activeTimeouts.set(reminder.id, timeout);
}

// Initialize all reminders on bot startup
export function initializeReminders(client) {
  console.log('🔄 Loading reminders from reminders.json...');
  
  const reminders = loadReminders();
  
  if (reminders.length === 0) {
    console.log('📭 No reminders to load.');
    return;
  }
  
  console.log(`📬 Found ${reminders.length} reminder(s). Scheduling...`);
  
  // Schedule each reminder silently (no messages sent)
  reminders.forEach(reminder => {
    scheduleReminder(client, reminder, true);
  });
  
  console.log(`✅ Reminder system initialized with ${activeTimeouts.size} active reminder(s).`);
}

// Export for use in other modules
export { scheduleReminder, removeReminder, loadReminders, saveReminders };
