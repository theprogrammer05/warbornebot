export default {
  name: 'price',
  description: 'Calculates gear cost (Starfall Token, Chest, Solarbite).',

  async execute(interaction) {
    const input = interaction.options.getString('numbers');
    if (!input) {
      return interaction.reply({
        content: '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\nExample: `5000000/340000/30`',
        ephemeral: true
      });
    }

    // Remove all spaces and split by comma
    const parts = input.replace(/\s+/g, '').split('/');
    if (parts.length !== 3 || parts.some(isNaN)) {
      return interaction.reply({
        content: '❌ Correct format: Starfall Token Cost\nStarfall Token Chest\nSolarbite Cost (for Chest)\n\nExample: `5000000/340000/30`',
        ephemeral: true
      });
    }

    const [tokenCost, chestSize, solarbiteCost] = parts.map(Number);
    const result = (chestSize / solarbiteCost) * tokenCost;

    await interaction.reply({
      content: `⭐ **Solarbite Break Even Value:** ${Math.round(result).toLocaleString()}`
    });
  }
};
