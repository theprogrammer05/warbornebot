import fs from 'fs';
import path from 'path';
import { updateGitHubFile } from '../utils/github.js';

const scheduleFile = path.join(process.cwd(), 'schedule.json');

const VALID_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      type: 1,
      description: 'View the weekly schedule',
    },
    {
      name: 'add',
      type: 1,
      description: 'Add an event to a specific day',
      options: [
        {
          name: 'day',
          type: 3, // STRING
          description: 'Day of the week',
          required: true,
          choices: VALID_DAYS.map(day => ({ name: day, value: day })),
        },
        {
          name: 'event',
          type: 3, // STRING
          description: 'Event description',
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an event from a specific day',
      options: [
        {
          name: 'day',
          type: 3, // STRING
          description: 'Day of the week',
          required: true,
          choices: VALID_DAYS.map(day => ({ name: day, value: day })),
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
        'Sunday': '🌞',
        'Monday': '💼',
        'Tuesday': '⚔️',
        'Wednesday': '🎓',
        'Thursday': '⚡',
        'Friday': '🎉',
        'Saturday': '🎖️'
      };

      const lines = VALID_DAYS.map(day => {
        const events = schedule[day] || [];
        const emoji = dayEmojis[day] || '📅';
        
        if (events.length === 0) {
          return `${emoji} **${day}**\n   • _No events scheduled_`;
        }
        
        const eventList = events.map((event, i) => `   **${i + 1}.** ${event}`).join('\n');
        return `${emoji} **${day}**\n${eventList}`;
      }).join('\n\n');

      return interaction.reply({
        content: 
          `📅 **Weekly Event Schedule**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${lines}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 *Use \`/wb-schedule add\` to add events*`,
        ephemeral: false,
      });
    }

    // ---------- ADD ----------
    if (sub === 'add') {
      const day = interaction.options.getString('day');
      const event = interaction.options.getString('event');

      if (!schedule[day]) {
        schedule[day] = [];
      }

      schedule[day].push(event);

      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Add event to ${day}`);

      return interaction.reply({
        content: 
          `✅ **Event Added Successfully!**\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 **Day:** ${day}\n` +
          `🎯 **Event:** ${event}\n` +
          `🔢 **Position:** #${schedule[day].length}`,
        ephemeral: true,
      });
    }

    // ---------- REMOVE ----------
    if (sub === 'remove') {
      const day = interaction.options.getString('day');
      const number = interaction.options.getInteger('number');

      if (!schedule[day] || schedule[day].length === 0) {
        return interaction.reply({
          content: `❌ **No Events Found**\n📅 **${day}** has no scheduled events.`,
          ephemeral: true,
        });
      }

      if (number < 1 || number > schedule[day].length) {
        return interaction.reply({
          content: 
            `❌ **Invalid Event Number**\n` +
            `📅 **${day}** has **${schedule[day].length}** event(s).\n` +
            `🔢 Please choose a number between **1** and **${schedule[day].length}**.`,
          ephemeral: true,
        });
      }

      const removed = schedule[day].splice(number - 1, 1)[0];

      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      await updateGitHubFile('schedule.json', schedule, `Remove event from ${day}`);

      return interaction.reply({
        content: 
          `✅ **Event Removed Successfully!**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 **Day:** ${day}\n` +
          `🔢 **Event #${number}:** ${removed}`,
        ephemeral: true,
      });
    }
  },
};
