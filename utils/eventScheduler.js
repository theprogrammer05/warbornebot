import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

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
        event.job = cron.schedule(cronExpression, () => {
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

  let [_, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Convert to 24-hour format
  if (period) {
    if (period.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
  }

  return [hour, minute];
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
                  `**Event:** ${event.name} (${eventTime} CST)\n`;

    if (event.description) {
      message += `**Description:** ${event.description}\n`;
    }

    await channel.send(message);
  } catch (error) {
    console.error('❌ Error sending event reminder:', error);
  }
}
