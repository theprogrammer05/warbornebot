export default {
  name: 'price',
  description: 'Calculates Solarbite break even value from input',
  async execute(interaction) {
    const userInput = interaction.options.getString('numbers');

    if (!userInput) {
      return interaction.reply({
        content:
          '❌ You must provide numbers.\n' +
          'Correct format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)`\n' +
          'Or use space as delimiter: `StarfallTokenCost StarfallTokenChest SolarbiteCost`\n' +
          'You can also use k/M shorthand: e.g., 5m / 340k / 30\n' +
          'Example: `5000000/340000/30` or `5m 340k 30`',
        ephemeral: true,
      });
    }

    try {
      // Replace spaces with "/" to unify delimiter
      const cleanedInput = userInput.replace(/\s+/g, '/').replace(/,/g, '');
      const parts = cleanedInput.split('/').map(part => {
        part = part.trim().toLowerCase();
        if (part.endsWith('k')) return parseFloat(part) * 1_000;
        if (part.endsWith('m')) return parseFloat(part) * 1_000_000;
        return parseFloat(part);
      });

      if (parts.length !== 3 || parts.some(isNaN)) {
        return interaction.reply({
          content:
          '❌ Invalid numbers provided.\n' +
          'Correct format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)`\n' +
          'Or use space as delimiter: `StarfallTokenCost StarfallTokenChest SolarbiteCost`\n' +
          'You can also use k/M shorthand: e.g., 5m / 340k / 30\n' +
          'Example: `5000000/340000/30` or `5m 340k 30`',
          ephemeral: true,
        });
      }

      const [starfallCost, starfallChest, solarbiteCost] = parts;

      const result = solarbiteCost * (starfallCost / starfallChest) * 0.94;

      const formattedResult = result.toLocaleString(undefined, {
        maximumFractionDigits: 3,
      });

      await interaction.reply({
        content: `🌟 Solarbite Break Even Value for your input: \`${userInput}\` is **${formattedResult}**`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ Something went wrong while calculating. Check your input format.',
        ephemeral: true,
      });
    }
  },
};
