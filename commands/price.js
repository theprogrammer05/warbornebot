import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculates gear cost from token values')
    .addStringOption(option =>
      option
        .setName('values')
        .setDescription(
          'Enter: Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('values');

    // Remove spaces
    const sanitized = input.replace(/\s+/g, '');
    const parts = sanitized.split(',');

    if (parts.length !== 3) {
      await interaction.reply({
        content:
          '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
          'Example: 5000000,340000,30',
        ephemeral: true
      });
      return;
    }

    const [starfallCost, starfallChest, solarbite] = parts.map(Number);

    if (parts.some(isNaN)) {
      await interaction.reply({
        content:
          '❌ All values must be numbers.\n' +
          'Format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
          'Example: 5000000,340000,30',
        ephemeral: true
      });
      return;
    }

    // Calculate total
    const result = ((starfallCost / starfallChest) * solarbite) * 0.94;

    await interaction.reply(
      `💰 Result: ${result.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })}`
    );
  }
};
