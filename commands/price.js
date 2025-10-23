import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculates gear cost from comma-separated numbers')
    .addStringOption(option =>
      option
        .setName('numbers')
        .setDescription('Enter: Starfall Token Cost, Starfall Token Chest, Solarbite Cost (comma-separated)')
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      let input = interaction.options.getString('numbers');

      // Remove all spaces
      input = input.replace(/\s+/g, '');

      const [starfallCost, chestSize, solarbite] = input.split(',').map(Number);

      // Check if all numbers are valid
      if ([starfallCost, chestSize, solarbite].some(isNaN)) {
        throw new Error('Invalid numbers');
      }

      const result = ((starfallCost / chestSize) * solarbite) * 0.94;

      await interaction.reply(`Result: **${result.toLocaleString()}**`);
    } catch (err) {
      await interaction.reply(
        '⚠️ Error parsing input.\n' +
        'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
        'Example: `/price 5000000,340000,30`'
      );
    }
  }
};
