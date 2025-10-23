import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculates gear cost from Starfall and Solarbite values')
    .addNumberOption(option =>
      option
        .setName('starfall_cost')
        .setDescription('Cost of Starfall Token (NPC)')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('chest_size')
        .setDescription('Number of Starfall Tokens in a chest')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('solarbite')
        .setDescription('Solarbite cost for the chest')
        .setRequired(true)),

  async execute(interaction) {
    const starfallCost = interaction.options.getNumber('starfall_cost');
    const chestSize = interaction.options.getNumber('chest_size');
    const solarbite = interaction.options.getNumber('solarbite');

    if (!starfallCost || !chestSize || !solarbite) {
      return interaction.reply('❌ Missing required values.');
    }

    const result = ((starfallCost / chestSize) * solarbite) * 0.94;

    await interaction.reply(`✅ Result: ${result.toLocaleString()}`);
  }
};
