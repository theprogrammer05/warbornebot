export default {
  name: 'wb-price',
  description: 'Calculate the break-even Solarbite value for equipment',
  options: [
    {
      name: 'equip_cost',
      type: 3, // STRING
      description: 'Equipment Starfall cost (e.g., 5m, 5000000)',
      required: true
    },
    {
      name: 'chest_size',
      type: 3, // STRING
      description: 'Starfall Chest Size (e.g., 170k, 340k, 340000)',
      required: true
    },
    {
      name: 'solarbite_cost',
      type: 3, // STRING
      description: 'Solarbite Starfall Chest cost (e.g., 30)',
      required: true
    }
  ],
  async execute(interaction) {
    // Get input values
    const equipCostInput = interaction.options.getString('equip_cost');
    const chestCostInput = interaction.options.getString('chest_size');
    const solarbiteCostInput = interaction.options.getString('solarbite_cost');

    // Helper function to parse input values
    const parseInput = (input, name) => {
      const value = input.trim().toLowerCase();
      const num = value.endsWith('k')
        ? parseFloat(value) * 1_000
        : value.endsWith('m')
        ? parseFloat(value) * 1_000_000
        : parseFloat(value);
      
      if (isNaN(num) || num <= 0) {
        throw new Error(`❌ Invalid ${name}. Must be a positive number. Examples: 5m, 340k, 30`);
      }
      return num;
    };

    try {
      // Parse all inputs
      const equipStarfallCost = parseInput(equipCostInput, 'equipment cost');
      const starfallChestCost = parseInput(chestCostInput, 'chest cost');
      const solarbiteStarfallChestCost = parseInput(solarbiteCostInput, 'solarbite cost');

      if (starfallChestCost === 0) {
        throw new Error('❌ Starfall Chest cost cannot be zero');
      }

    const trueValue =
      solarbiteStarfallChestCost * (equipStarfallCost / starfallChestCost);
    const marketValue = trueValue / 0.94;

    const formattedTrue = trueValue.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    const formattedMarket = marketValue.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

      await interaction.reply({
        content:
          `🔶 **Solarbite Break-Even Value**\n` +
          `• Equipment Cost: ${equipStarfallCost.toLocaleString()} 🪙 Starfall\n` +
          `• Chest Size: ${starfallChestCost.toLocaleString()} 🪙 Starfall\n` +
          `• Solarbite Cost: ${solarbiteStarfallChestCost} 🔶 Solarbite\n\n` +
          `• **True Value:** ${formattedTrue} 🔶 Solarbite\n` +
          `• **Market Value (after 6% cut):** ${formattedMarket} 🔶 Solarbite`,
      });
    } catch (error) {
      console.error('Error in price calculation:', error);
      await interaction.reply({
        content: error.message || '❌ An error occurred while calculating the price',
        ephemeral: true
      });
    }
  },
};
