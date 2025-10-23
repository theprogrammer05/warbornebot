import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculates Starfall Token Chest cost efficiency.')
    .addStringOption(option =>
      option
        .setName('input')
        .setDescription('Enter: Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input');
    const cleaned = input.replace(/\s+/g, '');
    const parts = cleaned.split(',');

    if (parts.length !== 3 || parts.some(isNaN)) {
      return interaction.reply({
        content:
          '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\nExample: `5000000,340000,30`',
        ephemeral: true,
      });
    }

    const [tokenCost, chestCost, solarCost] = parts.map(Number);

    // Compute your key number here (modify if you prefer a different formula)
    const ratio = (chestCost / tokenCost) * 100;
    const solPerChest = chestCost / solarCost;

    // Reply ONLY with the number you care about — for example:
    const result = solPerChest.toFixed(2);

    await interaction.reply(`💰 Solarbite Break Even: ${result}`);
  },
};
