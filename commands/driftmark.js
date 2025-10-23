import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('driftmark')
    .setDescription('Shows Driftmark rewards by tier'),
  async execute(interaction) {
    const output = `Tier 5: 1,400 Exergy, 17,300 Starfall (20 minutes)

6  12,000  41,300  4 hours
7  30,000  282,000  1 day 18 hr
8  45,000  812,000  3 days
9  60,000  3,890,000  3 days
10  90,000  6,000,000  3 days`;
    await interaction.reply(output);
  }
};
