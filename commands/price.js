export default {
  name: 'price',
  description: 'Calculates Solarbite break-even value from input.',
  async execute(interaction) {
    const userInput = interaction.options.getString('numbers');
    const help =
      '❌ Invalid input.\n' +
      'Format: `equipStarfallCost / starfallChestCost / solarbiteStarfallChestCost` (or spaces)\n' +
      'Shorthand allowed: k = 1k, m = 1M. Examples: `5m 340k 30` or `5000000/340000/30`';

    if (!userInput)
      return interaction.reply({ content: help, ephemeral: true });

    // normalize input
    const parts = userInput
      .replace(/\s+/g, '/')
      .replace(/,/g, '')
      .split('/')
      .map(p => p.trim().toLowerCase());

    if (parts.length !== 3)
      return interaction.reply({ content: help, ephemeral: true });

    const parse = s =>
      s.endsWith('k')
        ? parseFloat(s) * 1_000
        : s.endsWith('m')
        ? parseFloat(s) * 1_000_000
        : parseFloat(s);

    const [equipStarfallCost, starfallChestCost, solarbiteStarfallChestCost] =
      parts.map(parse);

    if (
      [equipStarfallCost, starfallChestCost, solarbiteStarfallChestCost].some(
        isNaN
      ) ||
      starfallChestCost === 0
    )
      return interaction.reply({
        content:
          '❌ Values must be valid numbers, and chest cost cannot be zero.\nExample: `5m 340k 30`',
        ephemeral: true,
      });

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
        `🌟 **Solarbite Break-Even Value** for \`${userInput}\`:\n` +
        `• **True Value:** ${formattedTrue}\n` +
        `• **Market Value (after 6% cut):** ${formattedMarket}`,
    });
  },
};
