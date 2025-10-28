import fs from 'fs';
import path from 'path';
import { scheduleJob } from 'node-schedule';

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
        
        const reminderTime = new Date();
        reminderTime.setHours(hours);
        reminderTime.setMinutes(minutes - 30);
        reminderTime.setSeconds(0);
        
        // If the reminder time has already passed today, schedule for next week
        if (reminderTime < new Date()) {
          reminderTime.setDate(reminderTime.getDate() + 7);
        }
        
        // Schedule the reminder
        event.job = scheduleJob(
          { hour: reminderTime.getHours(), minute: reminderTime.getMinutes(), dayOfWeek: getDayIndex(day) },
          () => sendEventReminder(client, day, event, time)
        );
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
