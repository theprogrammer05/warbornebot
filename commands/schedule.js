import fs from 'fs';
import path from 'path';

export default {
  name: 'schedule',
  description: 'Displays the weekly schedule.',
  execute(interaction) {
    const scheduleFile = path.join(process.cwd(), 'schedule.json');

    if (!fs.existsSync(scheduleFile)) {
      return interaction.reply({ content: '❌ Schedule file not found.', ephemeral: true });
    }

    const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    const lines = Object.entries(schedule)
      .map(([day, event]) => `${day}: ${event}`)
      .join('\n');

    interaction.reply({ content: `📅 **Weekly Schedule:**\n${lines}`, ephemeral: false });
  }
};
