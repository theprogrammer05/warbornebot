import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculate Gear Cost. Format: Starfall Cost, Chest Size, Solarbite Cost'),

  async execute(interaction) {
    const input = interaction.options.getString('input');

    if (!input) {
      return interaction.reply(
        '❌ You need to provide input!\n' +
        'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
        'Example: `5000000,340000,30`'
      );
    }

    try {
      // Remove spaces and split by comma
      const parts = input.replace(/\s+/g, '').split(',');
      if (parts.length !== 3) throw new Error('Invalid number of inputs');

      const [starfallCost, chestSize, solarbiteCost] = parts.map(Number);

      if (parts.some(isNaN)) throw new Error('All values must be numbers');

      const result = ((starfallCost / chestSize) * solarbiteCost) * 0.94;

      await interaction.reply(`💰 Result: ${result.toLocaleString()}`);
    } catch (err) {
      await interaction.reply(
        '❌ Invalid input!\n' +
        'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
        'Example: `5000000,340000,30`'
      );
    }
  }
};
