import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculates gear cost from Starfall, chest, and Solarbite')
    .addStringOption(option =>
      option.setName('values')
        .setDescription('Comma-separated: Starfall Cost, Chest Size, Solarbite')
        .setRequired(true)
    ),

  async execute(interaction) {
    const input = interaction.options.getString('values');
    const parts = input.split(',').map(x => parseFloat(x.trim()));

    if (parts.length !== 3 || parts.some(isNaN)) {
      return interaction.reply({
        content: '❌ Invalid input. Use: StarfallCost,ChestSize,Solarbite',
        ephemeral: true
      });
    }

    const [starfallCost, chestSize, solarbite] = parts;
    const result = ((starfallCost / chestSize) * solarbite) * 0.94;

    return interaction.reply(`💰 Calculated price (Solarbite Break Even): ${result.toLocaleString()}`);
  }
};
