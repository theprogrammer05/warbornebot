/**
 * Event Scheduler
 * Manages cron jobs for scheduled events. Sends 30-minute reminders and
 * event notifications at the specified CST times. Supports daily and weekly events.
 */

import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { parseTimeString } from './timeUtils.js';

const scheduleFile = path.join(process.cwd(), 'schedule.json');
const activeJobs = [];

function getDayIndex(day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const index = days.indexOf(day.toLowerCase());
  return index >= 0 ? index : null;
}

async function sendEventReminder(client, day, event, eventTime, isReminder = false) {
  try {
    const channel = await client.channels.fetch(process.env.ANNOUNCE_CHANNEL_ID);
    if (!channel) return console.error('❌ Could not find announcement channel.');

    let message = isReminder ? `⏰ **30-Minute Reminder**\n` : `🔔 **Event Starting Now**\n`;
    if (day !== 'Everyday') message += `**Day:** ${day}\n`;
    message += `**Event:** ${event.name} (${eventTime} CST)\n`;
    if (event.description) message += `**Description:** ${event.description}\n`;

    await channel.send(message);
  } catch (error) {
    console.error('❌ Error sending event reminder:', error);
  }
}

function clearAllJobs() {
  activeJobs.forEach(job => job?.stop?.());
  activeJobs.length = 0;
}

export function initializeEventScheduler(client) {
  clearAllJobs();
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));

  Object.entries(schedule).forEach(([day, events]) => {
    if (!Array.isArray(events)) return;
    
    events.forEach(event => {
      if (!event.times?.length) return;

      event.times.forEach(time => {
        const [hours, minutes] = parseTimeString(time);
        if (hours === null) return;
        
        const eventDate = new Date();
        eventDate.setHours(hours, minutes, 0, 0);
        const reminderDate = new Date(eventDate.getTime() - 30 * 60 * 1000);
        const reminderHours = reminderDate.getHours();
        const reminderMinutes = reminderDate.getMinutes();
        
        const scheduleJob = (cronExpr, isReminder) => {
          const job = cron.schedule(cronExpr, () => {
            sendEventReminder(client, day, event, time, isReminder);
          }, { scheduled: true, timezone: 'America/Chicago' });
          activeJobs.push(job);
        };
        
        if (day === 'Everyday') {
          scheduleJob(`0 ${minutes} ${hours} * * *`, false);
          scheduleJob(`0 ${reminderMinutes} ${reminderHours} * * *`, true);
        } else {
          const dayOfWeek = getDayIndex(day);
          if (dayOfWeek === null) return;
          
          scheduleJob(`0 ${minutes} ${hours} * * ${dayOfWeek}`, false);
          const reminderDay = reminderDate.getDate() === eventDate.getDate() 
            ? dayOfWeek 
            : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
          scheduleJob(`0 ${reminderMinutes} ${reminderHours} * * ${reminderDay}`, true);
        }
      });
    });
  });
  
  console.log(`✅ Scheduled ${activeJobs.length} event notifications`);
}
