export default {
  name: 'price',
  description: 'Calculates Solarbite break-even value from input.',
  async execute(interaction) {
    const userInput = interaction.options.getString('numbers');

    const helpText =
      '❌ Invalid input.\n' +
      'Format: `equipStarfallCost / starfallChestCost / solarbiteStarfallChestCost` (or spaces)\n' +
      'Shorthand allowed: k = 1k, m = 1M.\n' +
      'Examples: `5m 340k 30` or `5000000/340000/30`';

    if (!userInput) {
      return interaction.reply({ content: helpText, ephemeral: true });
    }

    // Normalize input
    const cleanedInput = userInput.replace(/\s+/g, '/').replace(/,/g, '');
    const parts = cleanedInput.split('/').map(p => p.trim().toLowerCase());

    if (parts.length !== 3) {
      return interaction.reply({ content: helpText, ephemeral: true });
    }

    // Parser with shorthand support (k = thousand, m = million)
    const parseValue = s => {
      if (s.endsWith('k')) return parseFloat(s.slice(0, -1)) * 1_000;
      if (s.endsWith('m')) return parseFloat(s.slice(0, -1)) * 1_000_000;
      return parseFloat(s);
    };

    const [equipStarfallCost, starfallChestCost, solarbiteStarfallChestCost] = parts.map(parseValue);

    if ([equipStarfallCost, starfallChestCost, solarbiteStarfallChestCost].some(isNaN) || starfallChestCost === 0) {
      return interaction.reply({
        content: '❌ Values must be valid numbers, and chest cost cannot be zero.\nExample: `5m 340k 30`',
        ephemeral: true,
      });
    }

    // Formula
    const trueValue = solarbiteStarfallChestCost * (equipStarfallCost / starfallChestCost);
    const marketValue = trueValue / 0.94;

    // Format numbers
    const formattedTrue = trueValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedMarket = marketValue.toLocaleString(undefined, { maximumFractionDigits: 2 });

    // Reply
    await interaction.reply({
      content:
        `🌟 **Solarbite Break-Even Value** for \`${userInput}\`:\n\n` +
        `• **True Value:** ${formattedTrue}\n` +
        `• **Market Value (after 6% cut):** ${formattedMarket}`,
    });
  },
};
