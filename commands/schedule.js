/**
 * Schedule Command
 * Manages weekly event schedules with CST times. Events trigger 30-minute reminders
 * and notifications at the specified time. Supports daily "Everyday" events and
 * day-specific events. Admin-only modifications with GitHub sync.
 */

import fs from 'fs';
import path from 'path';
import { MessageFlags } from 'discord.js';
import { updateGitHubFile } from '../utils/github.js';
import { validateAndFormatTime } from '../utils/timeUtils.js';

const scheduleFile = path.join(process.cwd(), 'schedule.json');
const VALID_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = [...VALID_DAYS, 'Everyday'];

function initializeSchedule() {
  if (!fs.existsSync(scheduleFile)) {
    const emptySchedule = { Everyday: [] };
    VALID_DAYS.forEach(day => emptySchedule[day] = []);
    fs.writeFileSync(scheduleFile, JSON.stringify(emptySchedule, null, 2));
    return emptySchedule;
  }
  
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  let needsMigration = false;
  
  if (!schedule.Everyday) {
    schedule.Everyday = [];
    needsMigration = true;
  }
  
  VALID_DAYS.forEach(day => {
    if (!schedule[day]) {
      schedule[day] = [];
      needsMigration = true;
    } else if (typeof schedule[day] === 'string') {
      schedule[day] = [schedule[day]];
      needsMigration = true;
    }
  });
  
  if (needsMigration) {
    fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
  }
  
  return schedule;
}

initializeSchedule();

export default {
  name: 'wb-schedule',
  description: 'View or manage the weekly event schedule',
  options: [
    {
      name: 'view',
      type: 1,
      description: 'View the weekly schedule',
      options: []
    },
    {
      name: 'add',
      type: 1,
      description: 'Add an event to a specific day or Everyday section',
      options: [
        {
          name: 'day',
          type: 3,
          description: 'Day of the week or "Everyday" for daily events',
          required: true,
          choices: ALL_DAYS.map(day => ({
            name: day === 'Everyday' ? 'Everyday (Daily)' : day,
            value: day
          })),
        },
        {
          name: 'name',
          type: 3,
          description: 'Name of the event',
          required: true,
        },
        {
          name: 'description',
          type: 3,
          description: 'Description of the event',
          required: true,
        },
        {
          name: 'times',
          type: 3,
          description: 'Event times in CST (comma separated, e.g., "6:00 PM, 8:00 PM")',
          required: false,
        },
      ],
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an event from a specific day or Everyday section',
      options: [
        {
          name: 'day',
          type: 3,
          description: 'Day of the week or "Everyday" for daily events',
          required: true,
          choices: ALL_DAYS.map(day => ({
            name: day === 'Everyday' ? 'Everyday (Daily)' : day,
            value: day
          })),
        },
        {
          name: 'number',
          type: 4,
          description: 'Event number to remove (see /wb-schedule view)',
          required: true,
        },
      ],
    },
  ],

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));

    if (sub === 'view' || !sub) {
      const dayEmojis = {
        'Sunday': '♻️',
        'Monday': '🏆',
        'Tuesday': '⚡',
        'Wednesday': '📈',
        'Thursday': '☢️',
        'Friday': '⚔️',
        'Saturday': '🥩'
      };

      const formatEvents = (events, day, emoji) => {
        if (!events.length) return `\n${emoji} **${day}**\n   • _No events scheduled_`;
        
        let text = `\n${emoji} **${day}**`;
        events.forEach((event, i) => {
          text += `\n   **${i + 1}.** **Event:** ${event.name}`;
          if (event.times?.length > 0) text += `\n     **Time:** ${event.times.join(', ')} CST`;
          if (event.description) text += `\n     **Description:** ${event.description}`;
        });
        return text;
      };

      let message = '📅 **Weekly Event Schedule**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      message += formatEvents(schedule.Everyday || [], 'Everyday (Daily)', '🌟');
      
      VALID_DAYS.forEach(day => {
        message += formatEvents(schedule[day] || [], day, dayEmojis[day] || '📅');
      });
      
      message += '\n\n💡 *Use `/wb-schedule add` to add events*';

      return interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'add') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          content: '❌ **Permission Denied**\nYou need administrator permissions to modify the schedule.',
          flags: MessageFlags.Ephemeral
        });
      }

      const day = interaction.options.getString('day');
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const timesStr = interaction.options.getString('times');
      
      if (!schedule[day]) schedule[day] = [];
      
      let times = [];
      if (timesStr) {
        const timeInputs = timesStr.split(',').map(t => t.trim()).filter(Boolean);
        const invalidTimes = [];
        
        for (const timeInput of timeInputs) {
          const formattedTime = validateAndFormatTime(timeInput);
          if (formattedTime) {
            times.push(formattedTime);
          } else {
            invalidTimes.push(timeInput);
          }
        }
        
        if (invalidTimes.length > 0) {
          return interaction.reply({
            content: `❌ **Invalid Time Format**\nThe following times are not in a valid format (use HH:MM AM/PM):\n${invalidTimes.join(', ')}\n\nExample: \`6:00 PM, 8:00 PM\``,
            flags: MessageFlags.Ephemeral
          });
        }
      }
      
      const event = { name, description };
      if (times.length > 0) event.times = [...new Set(times)];
      
      schedule[day].push(event);
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Add event to ${day}`);
      
      const { initializeEventScheduler } = await import('../utils/eventScheduler.js');
      initializeEventScheduler(interaction.client);

      let response = 
        `✅ **Event Added Successfully!**\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📅 **${day}**\n` +
        `📝 **Event:** ${name}\n`;
        
      if (times.length > 0) {
        response += `⏰ **Times:** ${times.join(', ')}\n`;
      }
      
      response += `📋 **Description:** ${description}\n\n`;
      response += `The schedule has been updated.`;

      return interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'remove') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          content: '❌ **Permission Denied**\nYou need administrator permissions to modify the schedule.',
          flags: MessageFlags.Ephemeral
        });
      }

      const day = interaction.options.getString('day');
      const number = interaction.options.getInteger('number');
      const events = schedule[day] || [];

      if (number < 1 || number > events.length) {
        return interaction.reply({
          content: `❌ Invalid event number. Must be between 1 and ${events.length}`,
          flags: MessageFlags.Ephemeral
        });
      }

      const removedEvent = events.splice(number - 1, 1)[0];
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Remove event from ${day}`);
      
      const { initializeEventScheduler } = await import('../utils/eventScheduler.js');
      initializeEventScheduler(interaction.client);

      let response = 
        `✅ **Event Removed Successfully!**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🗑️ Removed from **${day}**:\n` +
        `📝 **Event:** ${removedEvent.name}\n`;
        
      if (removedEvent.times?.length > 0) {
        response += `⏰ **Was scheduled at:** ${removedEvent.times.join(', ')} CST\n`;
      }
      
      response += `\nThe schedule has been updated.`;

      return interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
