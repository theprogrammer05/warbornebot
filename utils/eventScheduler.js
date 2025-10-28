import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

const scheduleFile = path.join(process.cwd(), 'schedule.json');

function getDayIndex(day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLower = day.toLowerCase();
  if (dayLower === 'everyday') return null; // Special case for everyday events
  const index = days.indexOf(dayLower);
  return index >= 0 ? index : null;
}

async function sendEventReminder(client, day, event, eventTime) {
  try {
    const channel = await client.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
    if (!channel) {
      console.error('❌ Could not find announcement channel for event reminder.');
      return;
    }

    let message = `🔔 **Event Reminder**\n`;
    
    // Add day info only if it's not an everyday event
    if (day !== 'Everyday') {
      message += `**Day:** ${day}\n`;
    }
    
    message += `**Event:** ${event.name} (${eventTime} CST)\n`;
    
    if (event.description) {
      message += `**Description:** ${event.description}\n`;
    }

    await channel.send(message);
  } catch (error) {
    console.error('❌ Error sending event reminder:', error);
  }
}

// Initialize event scheduler
export function initializeEventScheduler(client) {
  // Load schedule
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));

  // Clear all existing jobs
  // Clear existing jobs
  Object.keys(schedule).forEach(day => {
    const events = Array.isArray(schedule[day]) ? schedule[day] : [];
    events.forEach(event => {
      // Clear any existing jobs for this event
      if (event.job) {
        event.job.cancel();
      }
    });
  });

  // Helper function to parse time string "HH:MM" into hours and minutes
  function parseTimeString(timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
    if (!match) return [null, null];
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toLowerCase() : null;
    
    // Convert to 24-hour format if needed
    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return [hours, minutes];
  }

  // Schedule new jobs
  Object.entries(schedule).forEach(([day, events]) => {
    if (!Array.isArray(events)) return;
    
    events.forEach(event => {
      // Skip if no times are set
      if (!event.times || !Array.isArray(event.times) || event.times.length === 0) return;

      event.times.forEach(time => {
        const [hours, minutes] = parseTimeString(time);
        if (hours === null || minutes === null) return;
        
        let cronExpression;
        
        if (day === 'Everyday') {
          // For everyday events, run every day at the specified time
          cronExpression = `0 ${minutes} ${hours} * * *`;
        } else {
          // For specific days, run on that day of the week
          const dayOfWeek = getDayIndex(day);
          if (dayOfWeek === null) return; // Invalid day
          
          // Format: second minute hour day-of-month month day-of-week
          cronExpression = `0 ${minutes} ${hours} * * ${dayOfWeek}`;
        }
        
        // Schedule the reminder
        event.job = cron.schedule(cronExpression, () => {
          sendEventReminder(client, day, event, time);
        });
      });
    });
  });
}
