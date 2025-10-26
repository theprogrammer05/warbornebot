import fs from 'fs';
import path from 'path';

export default {
  name: 'wb-season-event',
  description: 'Set the start date of a season event.',
  subcommands: [
    {
      name: 'set',
      description: 'Set the event start date (YYYY-MM-DD)',
      options: [
        { name: 'date', type: 3, description: 'Season event date', required: true }
      ]
    }
  ],
  execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const date = interaction.options.getString('date');
      const scheduleFile = path.join(process.cwd(), 'schedule.json');

      if (!fs.existsSync(scheduleFile)) {
        return interaction.reply({ content: '❌ Schedule file not found.', ephemeral: true });
      }

      const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
      schedule['SeasonEventStart'] = date;
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));

      return interaction.reply({ content: `✅ Season start date set to ${date}.` });
    }
  }
};
