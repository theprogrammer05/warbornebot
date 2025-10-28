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

async function sendEventReminder(client, day, event, eventTime, isReminder = false) {
  try {
    const channel = await client.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
    if (!channel) {
      console.error('❌ Could not find announcement channel for event reminder.');
      return;
    }

    let message = isReminder 
      ? `⏰ **30-Minute Reminder**\n` 
      : `🔔 **Event Starting Now**\n`;
    
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

// Store the client instance and jobs
let schedulerClient;
const activeJobs = [];

// Clear all scheduled jobs
function clearAllJobs() {
  activeJobs.forEach(job => {
    if (job && job.stop) job.stop();
  });
  activeJobs.length = 0;
}

// Initialize event scheduler
export function initializeEventScheduler(client) {
  // Store the client instance
  schedulerClient = client;
  
  // Clear all existing jobs
  clearAllJobs();
  
  // Load schedule
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  
  // Clear any existing jobs in the schedule
  Object.values(schedule).forEach(events => {
    if (Array.isArray(events)) {
      events.forEach(event => {
        delete event.job;
        delete event.reminderJob;
      });
    }
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
        
        // Create a date object to handle time calculations
        const eventDate = new Date();
        eventDate.setHours(hours, minutes, 0, 0);
        
        // Calculate 30 minutes before the event
        const reminderDate = new Date(eventDate.getTime() - 30 * 60 * 1000);
        const reminderHours = reminderDate.getHours();
        const reminderMinutes = reminderDate.getMinutes();
        
        let cronExpression, reminderCronExpression;
        
        if (day === 'Everyday') {
          // For everyday events
          cronExpression = `0 ${minutes} ${hours} * * *`;
          reminderCronExpression = `0 ${reminderMinutes} ${reminderHours} * * *`;
        } else {
          // For specific days
          const dayOfWeek = getDayIndex(day);
          if (dayOfWeek === null) return; // Invalid day
          
          // If reminder is on the same day
          if (reminderDate.getDate() === eventDate.getDate()) {
            cronExpression = `0 ${minutes} ${hours} * * ${dayOfWeek}`;
            reminderCronExpression = `0 ${reminderMinutes} ${reminderHours} * * ${dayOfWeek}`;
          } else {
            // If reminder is on the previous day (for early morning events)
            const previousDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Saturday = 6
            cronExpression = `0 ${minutes} ${hours} * * ${dayOfWeek}`;
            reminderCronExpression = `0 ${reminderMinutes} ${reminderHours} * * ${previousDay}`;
          }
        }
        
        // Schedule the 30-minute reminder
        if (reminderCronExpression) {
          const reminderJob = cron.schedule(reminderCronExpression, () => {
            console.log(`Sending 30-min reminder for ${event.name} at ${time}`);
            sendEventReminder(client, day, event, time, true); // true = isReminder
          }, {
            scheduled: true,
            timezone: 'America/Chicago' // CST timezone
          });
          activeJobs.push(reminderJob);
          event.reminderJob = reminderJob;
        }
        
        // Schedule the main event
        const mainJob = cron.schedule(cronExpression, () => {
          console.log(`Sending event notification for ${event.name} at ${time}`);
          sendEventReminder(client, day, event, time, false); // false = not a reminder
        }, {
          scheduled: true,
          timezone: 'America/Chicago' // CST timezone
        });
        activeJobs.push(mainJob);
        event.job = mainJob;
      });
    });
  });
}
