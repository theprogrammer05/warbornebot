import fs from 'fs';
import path from 'path';
import { updateGitHubFile } from './github.js';

const remindersFile = path.join(process.cwd(), 'reminders.json');

// Active timeouts map
const activeTimeouts = new Map();

// Debounce timer for GitHub sync
let githubSyncTimeout = null;
const GITHUB_SYNC_DELAY = 2 * 60 * 1000; // 2 minutes

// Load reminders from file
function loadReminders() {
  try {
    return JSON.parse(fs.readFileSync(remindersFile, 'utf8'));
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

// Debounced GitHub sync function
function scheduleDebouncedGitHubSync() {
  // Clear existing timeout
  if (githubSyncTimeout) {
    clearTimeout(githubSyncTimeout);
  }
  
  // Schedule new sync after delay
  githubSyncTimeout = setTimeout(async () => {
    try {
      const reminders = loadReminders();
      console.log(`🔄 Syncing reminders.json to GitHub (${reminders.length} reminder(s))...`);
      await updateGitHubFile('reminders.json', reminders, 'Update reminders via Discord bot');
      console.log('✅ GitHub sync completed');
    } catch (err) {
      console.error('⚠️ GitHub sync failed:', err);
    }
  }, GITHUB_SYNC_DELAY);
  
  console.log(`⏳ GitHub sync scheduled in ${GITHUB_SYNC_DELAY / 1000 / 60} minutes`);
}

// Save reminders to file and schedule debounced GitHub sync
async function saveReminders(reminders) {
  // Save to local file immediately
  fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
  
  // Schedule debounced GitHub sync (batches multiple changes)
  scheduleDebouncedGitHubSync();
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
  try {
    console.log('🔄 Loading reminders from reminders.json...');
    console.log(`📁 Reminder file path: ${remindersFile}`);
    
    const reminders = loadReminders();
    
    if (reminders.length === 0) {
      console.log('📭 No reminders to load.');
      return;
    }
    
    console.log(`📬 Found ${reminders.length} reminder(s). Scheduling...`);
    
    // Schedule each reminder silently (no messages sent)
    reminders.forEach((reminder, index) => {
      console.log(`  ${index + 1}. Reminder ID: ${reminder.id}, Trigger: ${new Date(reminder.triggerTime).toLocaleString()}`);
      scheduleReminder(client, reminder, true);
    });
    
    console.log(`✅ Reminder system initialized with ${activeTimeouts.size} active reminder(s).`);
  } catch (error) {
    console.error('❌ Error initializing reminders:', error);
  }
}

// Force immediate GitHub sync (for graceful shutdown)
export async function forceGitHubSync() {
  if (githubSyncTimeout) {
    clearTimeout(githubSyncTimeout);
    githubSyncTimeout = null;
  }
  
  try {
    const reminders = loadReminders();
    console.log(`🔄 Force syncing reminders.json to GitHub...`);
    await updateGitHubFile('reminders.json', reminders, 'Update reminders via Discord bot');
    console.log('✅ Force sync completed');
    return true;
  } catch (err) {
    console.error('⚠️ Force sync failed:', err);
    return false;
  }
}

// Export for use in other modules
export { scheduleReminder, removeReminder, loadReminders, saveReminders };
