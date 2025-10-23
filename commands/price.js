export default {
  name: 'price',
  description: 'Calculates Solarbite Break Even Value from your inputs.',
  async execute(interaction) {
    const input = interaction.options.getString('numbers');

    if (!input) {
      return interaction.reply({
        content: '❌ Correct format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)`\nExample: 5000000/340000/30',
        ephemeral: true
      });
    }

    // Remove spaces and split by "/"
    const parts = input.replace(/\s/g, '').split('/');

    if (parts.length !== 3) {
      return interaction.reply({
        content: '❌ Correct format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)`\nExample: 5000000/340000/30',
        ephemeral: true
      });
    }

    const [starfallCostStr, chestSizeStr, solarbiteCostStr] = parts;
    const starfallCost = parseFloat(starfallCostStr);
    const chestSize = parseFloat(chestSizeStr);
    const solarbiteCost = parseFloat(solarbiteCostStr);

    if (isNaN(starfallCost) || isNaN(chestSize) || isNaN(solarbiteCost) || chestSize === 0) {
      return interaction.reply({
        content: '❌ All values must be numbers and chest size cannot be zero.',
        ephemeral: true
      });
    }

    const breakEven = solarbiteCost * (starfallCost / chestSize) * 0.94;

    // Format with commas and 2 decimal places
    const formatted = breakEven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return interaction.reply(`🌟 Solarbite Break Even Value: ${formatted}`);
  }
};
