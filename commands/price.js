import { SlashCommandBuilder } from '@discordjs/builders';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculate gear cost. Use commas, no spaces')
    .addStringOption(option =>
      option.setName('input')
        .setDescription('Starfall Cost, Chest Size, Solarbite Cost (for Chest)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const msg = interaction.options.getString('input').replace(/\s+/g, '');
    try {
      const parts = msg.split(',');
      if (parts.length !== 3) throw new Error();

      const [starfallCost, chestSize, solarbiteCost] = parts.map(Number);
      if (parts.some(isNaN)) throw new Error();

      const result = ((starfallCost / chestSize) * solarbiteCost) * 0.94;
      await interaction.reply(`💰 Result: ${result.toLocaleString()}`);
    } catch {
      await interaction.reply(
        '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\nExample: `5000000,340000,30`'
      );
    }
  }
};
