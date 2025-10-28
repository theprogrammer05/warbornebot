import fs from 'fs';
import path from 'path';
import { schedule } from 'node-cron';

const scheduleFile = path.join(process.cwd(), 'schedule.json');

export function initializeEventScheduler(client) {
  // Load schedule
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  
  // Clear all existing jobs
  Object.keys(schedule).forEach(day => {
    schedule[day].forEach(event => {
      // Clear any existing jobs for this event
      if (event.job) {
        event.job.cancel();
      }
    });
  });

  // Schedule new jobs
  Object.entries(schedule).forEach(([day, events]) => {
    events.forEach(event => {
      // Schedule main event reminder (30 minutes before)
      event.times.forEach(time => {
        const [hours, minutes] = parseTimeString(time);
        if (hours === null || minutes === null) return;
        
        // Calculate day of week (0-6, where 0 is Sunday)
        const dayOfWeek = getDayIndex(day);
        
        // Format cron expression: seconds(0) minutes hours dayOfMonth month dayOfWeek
        // We'll schedule it to run every week on the specified day
        const minute = minutes;
        const hour = hours;
        const cronExpression = `0 ${minute} ${hour} * * ${dayOfWeek}`;
        
        // Schedule the reminder
        event.job = schedule(cronExpression, () => {
          sendEventReminder(client, day, event, time);
        });
      });
    });
  });
}

function parseTimeString(timeStr) {
  // Handle time strings like "10:30 AM" or "3:30 PM"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return [null, null];
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : 'AM';
  
  // Convert to 24-hour format
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return [hours, minutes];
}

function getDayIndex(day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(day.toLowerCase());
}

async function sendEventReminder(client, day, event, eventTime) {
  try {
    const channel = await client.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
    if (!channel) {
      console.error('❌ Could not find announcement channel for event reminder.');
      return;
    }
    
    let message = `🔔 **Event Reminder**\n` +
                 `**Event:** ${event.name} (${eventTime} CST)`;
    if (event.description) {
      message += `\n**Description:** ${event.description}`;
    }
    await channel.send(message);
    
  } catch (error) {
    console.error('❌ Error sending event reminder:', error);
  }
}
