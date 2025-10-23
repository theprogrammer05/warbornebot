import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('drifter')
    .setDescription('Shows Drifter rewards by tier'),
  async execute(interaction) {
    const output = `Tier 8: 36,400
Tier 9: 47,300
Tier 10: 61,500
Tier 11: 79,900`;
    await interaction.reply(output);
  }
};
