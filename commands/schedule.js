/**
 * SCHEDULE COMMAND
 * 
 * Purpose: Display today's game events and manage the weekly schedule (responses are private)
 * 
 * Subcommands:
 * - today: Show today's events (Everyone)
 * - view: View schedule for a specific day (Everyone)
 * - set: Set events for a specific day (Admins only)
 * 
 * Features:
 * - Automatically detects current day (CST timezone)
 * - Rich embed formatting
 * - Admin-only schedule modification
 * - Persistent storage via schedule.json
 * - Automatic daily posting at midnight CST
 * 
 * Example Usage:
 * /wb-schedule today
 * /wb-schedule view day:"Monday"
 * /wb-schedule set day:"Monday" events:"100% Harvest Vault Experience & Chest Rewards"
 * 
 * Permissions: View (Everyone), Set (Administrators)
 * Data Storage: schedule.json (synced to GitHub)
 */

import fs from 'fs';
import path from 'path';
import { MessageFlags } from 'discord.js';
import { updateGitHubFile } from '../utils/github.js';

const scheduleFile = path.join(process.cwd(), 'schedule.json');
const VALID_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = [...VALID_DAYS, 'Everyday'];

// Initialize schedule.json with all days if it doesn't exist or is in old format
function initializeSchedule() {
  if (!fs.existsSync(scheduleFile)) {
    const emptySchedule = {};
    VALID_DAYS.forEach(day => emptySchedule[day] = []);
    fs.writeFileSync(scheduleFile, JSON.stringify(emptySchedule, null, 2));
    return emptySchedule;
  }
  
  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  
  // Migrate old format (string values) to new format (array values)
  let needsMigration = false;
  
  // Ensure Everyday section exists
  if (!schedule.Everyday) {
    schedule.Everyday = [];
    needsMigration = true;
  }
  
  // Handle regular days
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

// Initialize on load
initializeSchedule();

export default {
  name: 'wb-schedule',
  description: 'View or manage the weekly schedule',
  options: [
    {
      name: 'view',
      type: 1, // SUB_COMMAND
      description: 'View the weekly schedule',
    },
    {
      name: 'add',
      type: 1, // SUB_COMMAND
      description: 'Add an event to a specific day or Everyday section',
      options: [
        {
          name: 'day',
          type: 3, // STRING
          description: 'Day of the week or "Everyday" for daily events',
          required: true,
          choices: ALL_DAYS.map(day => ({
            name: day === 'Everyday' ? 'Everyday (Daily)' : day,
            value: day
          })),
        },
        {
          name: 'name',
          type: 3, // STRING
          description: 'Name of the event',
          required: true,
        },
        {
          name: 'description',
          type: 3, // STRING
          description: 'Description of the event',
          required: true,
        },
        {
          name: 'times',
          type: 3, // STRING
          description: 'Event times in CST (comma separated, e.g., "6:00 PM, 8:00 PM")',
          required: false,
        },
      ],
    },
    {
      name: 'remove',
      type: 1, // SUB_COMMAND
      description: 'Remove an event from a specific day or Everyday section',
      options: [
        {
          name: 'day',
          type: 3, // STRING
          description: 'Day of the week or "Everyday" for daily events',
          required: true,
          choices: ALL_DAYS.map(day => ({
            name: day === 'Everyday' ? 'Everyday (Daily)' : day,
            value: day
          })),
        },
        {
          name: 'number',
          type: 4, // INTEGER
          description: 'Event number to remove (see /wb-schedule view)',
          required: true,
        },
      ],
    },
  ],

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));

    // ---------- VIEW ----------
    if (sub === 'view' || !sub) {
      const dayEmojis = {
        'Sunday': '♻️',      // Double Scrap Post (recycling/scrap)
        'Monday': '🏆',      // 100% Harvest Vault Experience & Chest Rewards
        'Tuesday': '⚡',     // Exergy Event (energy)
        'Wednesday': '📈',   // 50% Experience (growth/leveling up)
        'Thursday': '☢️',    // Radiation Storm
        'Friday': '⚔️',      // Faction Contribution from PVP (combat)
        'Saturday': '🥩'     // Protein Event (meat/protein)
      };

      // Function to split text into chunks that fit within Discord's 2000 character limit
      const splitMessage = (text, maxLength = 2000) => {
        const chunks = [];
        while (text.length > 0) {
          let chunk = text.substring(0, maxLength);
          // Find the last newline within the chunk to avoid splitting messages in the middle of a line
          const lastNewLine = chunk.lastIndexOf('\n');
          if (lastNewLine > 0 && chunk.length > 1000) {
            chunk = chunk.substring(0, lastNewLine);
          }
          chunks.push(chunk);
          text = text.substring(chunk.length);
        }
        return chunks;
      };

      // Build the schedule in parts
      const header = '📅 **Weekly Event Schedule**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
      const footer = '\n💡 *Use `/wb-schedule add` to add events*';
      
      // Build schedule text for each day
      const daySections = [];
      for (const day of VALID_DAYS) {
        const events = schedule[day] || [];
        const emoji = dayEmojis[day] || '📅';
        
        let dayText = `${emoji} **${day}**\n`;
        
        if (events.length === 0) {
          dayText += '   • _No events scheduled_\n\n';
        } else {
          events.forEach((event, i) => {
            dayText += `   **${i + 1}.** **Event:** ${event.name}\n`;
            if (event.times?.length > 0) {
              dayText += `     **Time:** ${event.times.join(', ')} CST\n`;
            }
            if (event.description) {
              dayText += `     **Description:** ${event.description}\n`;
            }
            dayText += '\n';
          });
        }
        daySections.push(dayText);
      }

      // Combine all parts and split into chunks
      const fullMessage = header + daySections.join('\n') + footer;
      const messageChunks = splitMessage(fullMessage);

      // Send the first chunk as a reply
      await interaction.reply({
        content: messageChunks[0],
        flags: MessageFlags.Ephemeral
      });

      // Send remaining chunks as follow-ups
      for (let i = 1; i < messageChunks.length; i++) {
        await interaction.followUp({
          content: messageChunks[i],
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }

    // ---------- ADD ----------
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
      
      if (!schedule[day]) {
        schedule[day] = [];
      }
      
      // Parse times if provided
      const times = timesStr ? timesStr.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      // Create event object
      const event = { name, description };
      if (times.length > 0) {
        event.times = times;
      }
      
      schedule[day].push(event);
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Add event to ${day}`);

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

    // ---------- REMOVE ----------
    if (sub === 'remove') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({
          content: '❌ **Permission Denied**\nYou need administrator permissions to modify the schedule.',
          flags: MessageFlags.Ephemeral
        });
      }

      const day = interaction.options.getString('day');
      const number = interaction.options.getInteger('number');

      // Ensure the day exists in the schedule
      if (!ALL_DAYS.includes(day)) {
        if (day === 'Everyday') {
          // Handle 'Everyday' section
          const events = schedule.Everyday || [];
          if (number < 1 || number > events.length) {
            return interaction.reply({
              content: `❌ Invalid event number. Must be between 1 and ${events.length}`,
              flags: MessageFlags.Ephemeral
            });
          }

          const removedEvent = events.splice(number - 1, 1)[0];
          fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
          await updateGitHubFile('schedule.json', schedule, `Remove event from Everyday`);

          let response = 
            `✅ **Event Removed Successfully!**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🗑️ Removed from **Everyday**:\n` +
            `📝 **Event:** ${removedEvent.name}\n`;
            
          if (removedEvent.times && removedEvent.times.length > 0) {
            response += `⏰ **Was scheduled at:** ${removedEvent.times.join(', ')} CST\n`;
          }
          
          response += `\nThe schedule has been updated.`;

          return interaction.reply({
            content: response,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // Handle day selection
      if (day === 'Everyday') {
        // Add to Everyday section
        if (!schedule.Everyday) schedule.Everyday = [];
        
        const newEvent = {
          name: name,
          times: times,
          description: description
        };
        
        schedule.Everyday.push(newEvent);
          return interaction.reply({
            content: `❌ Invalid event number. Must be between 1 and ${events.length}`,
            flags: MessageFlags.Ephemeral
          });
        }

        const removedEvent = events.splice(number - 1, 1)[0];
        fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
        await updateGitHubFile('schedule.json', schedule, `Remove event from Everyday`);

        let response = 
          `✅ **Event Removed Successfully!**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🗑️ Removed from **Everyday**:\n` +
          `📝 **Event:** ${removedEvent.name}\n`;
          
        if (removedEvent.times && removedEvent.times.length > 0) {
          response += `⏰ **Was scheduled at:** ${removedEvent.times.join(', ')} CST\n`;
        }
        
        response += `\nThe schedule has been updated.`;

        return interaction.reply({
          content: response,
          flags: MessageFlags.Ephemeral
        });
      }

      if (number < 1 || number > schedule[day].length) {
        return interaction.reply({
          content: `❌ **Invalid Event Number**\n` +
            `📅 **${day}** has **${schedule[day].length}** event(s).\n` +
            `Please choose a number between 1 and ${schedule[day].length}.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const removedEvent = schedule[day].splice(number - 1, 1)[0];
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Remove event from ${day}`);

      let response = 
        `✅ **Event Removed Successfully!**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🗑️ Removed from **${day}**:\n` +
        `📝 **Event:** ${removedEvent.name}\n`;
        
      if (removedEvent.times && removedEvent.times.length > 0) {
        response += `⏰ **Was scheduled at:** ${removedEvent.times.join(', ')} CST\n`;
      }
      
      response += `\nThe schedule has been updated.`;

      return interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
