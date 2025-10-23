export default {
  name: 'price',
  description: 'Calculates gear solarbite breakeven value.',

  async execute(interaction) {
    const input = interaction.options.getString('numbers');
    if (!input) {
      return interaction.reply({
        content: '❌ Correct format:\nStarfall Token Cost\nStarfall Token in Chest\nSolarbite Cost (for Chest)\n\nExample: `5000000/340000/30`',
        ephemeral: true
      });
    }

    // Remove all spaces and split by comma
    const parts = input.replace(/\s+/g, '').split('/');
    if (parts.length !== 3 || parts.some(isNaN)) {
      return interaction.reply({
        content: '❌ Correct format:\nStarfall Token Cost\nStarfall Token in Chest\nSolarbite Cost (for Chest)\n\nExample: `5000000/340000/30`',
        ephemeral: true
      });
    }

    const [tokenCost, chestSize, solarbiteCost] = parts;
    const result = (chestSize / solarbiteCost) * tokenCost;

    await interaction.reply(`🌟 **Solarbite Break Even Value:** ${result.toLocaleString('en-US')}`);
  }
};
