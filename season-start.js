import fs from 'fs';
import path from 'path';

export default {
  name: 'season-start',
  description: 'Set the start of the season (or update a day\'s event).',
  options: [
    {
      name: 'day',
      type: 3, // STRING
      description: 'Day to update (e.g., Saturday, Monday)',
      required: true,
    },
    {
      name: 'event',
      type: 3, // STRING
      description: 'Event description for the day',
      required: true,
    },
  ],
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to set the schedule.',
        ephemeral: true,
      });
    }

    const day = interaction.options.getString('day');
    const event = interaction.options.getString('event');
    const scheduleFile = path.join(process.cwd(), 'schedule.json');

    let schedule = {};
    if (fs.existsSync(scheduleFile)) {
      schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    }

    schedule[day] = event;
    fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));

    await interaction.reply({
      content: `✅ Schedule updated: **${day}** → "${event}"`,
      ephemeral: false,
    });
  },
};
