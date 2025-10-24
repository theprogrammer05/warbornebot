import fs from 'fs';
import path from 'path';

export default {
  name: 'season-start',
  description: 'Show the schedule for a specific date or add/update an event for that day. Example usage: `/season-start date:2025-10-25` or `/season-start date:2025-10-25 add_event:"Double EXP"`',
  options: [
    {
      name: 'date',
      type: 3, // STRING
      description: 'Date to check or set the schedule for (format: YYYY-MM-DD). Example: 2025-10-25',
      required: true,
    },
    {
      name: 'add_event',
      type: 3, // STRING
      description: 'Optional: Add or update the event for this day. Example: "Double EXP Day"',
      required: false,
    },
  ],
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to use this command.',
        ephemeral: true,
      });
    }

    const dateInput = interaction.options.getString('date');
    const addEvent = interaction.options.getString('add_event');

    let date;
    try {
      date = new Date(dateInput);
      if (isNaN(date)) throw new Error('Invalid date');
    } catch (err) {
      return interaction.reply({
        content: '❌ Invalid date format. Use YYYY-MM-DD. Example: 2025-10-25',
        ephemeral: true,
      });
    }

    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

    const scheduleFile = path.join(process.cwd(), 'schedule.json');
    let schedule = {};
    if (fs.existsSync(scheduleFile)) {
      schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    }

    // Add or update event if provided
    if (addEvent) {
      schedule[weekday] = addEvent;
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      return interaction.reply({
        content: `✅ Event added/updated for **${weekday}**: "${addEvent}"`,
        ephemeral: false,
      });
    }

    // Show event for the date
    const event = schedule[weekday];
    if (!event) {
      return interaction.reply({
        content: `ℹ️ No event found for **${weekday}** (${dateInput}). You can add one using \`add_event\` option.`,
        ephemeral: false,
      });
    }

    await interaction.reply({
      content: `📅 **${weekday}, ${dateInput}**\nEvent: ${event}`,
      ephemeral: false,
    });
  },
};
