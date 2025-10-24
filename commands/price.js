export default {
  name: 'price',
  description: 'Calculates Solarbite break even value from input',
  async execute(interaction) {
    const userInput = interaction.options.getString('numbers');
    if (!userInput) {
      return interaction.reply({
        content:
          '❌ You must provide numbers.\n' +
          'Format: `StarfallTokenCost / StarfallTokenChest / SolarbiteCost` (or spaces)\n' +
          'Shorthand allowed: k = 1k, m = 1M. Examples: `5m 340k 30` or `5000000/340000/30`',
        ephemeral: true,
      });
    }

    // Normalize: treat spaces as "/" and remove commas
    const cleanedInput = userInput.replace(/\s+/g, '/').replace(/,/g, '');
    const parts = cleanedInput.split('/').map(p => p.trim().toLowerCase());

    if (parts.length !== 3) {
      return interaction.reply({
        content:
          '❌ Invalid input count. Use: `StarfallTokenCost / StarfallTokenChest / SolarbiteCost`',
        ephemeral: true,
      });
    }

    const parse = s => {
      if (s.endsWith('k')) return parseFloat(s.slice(0, -1)) * 1_000;
      if (s.endsWith('m')) return parseFloat(s.slice(0, -1)) * 1_000_000;
      return parseFloat(s);
    };

    const starfallCost = parse(parts[0]);
    const starfallChest = parse(parts[1]);
    const solarbite = parse(parts[2]);

    if ([starfallCost, starfallChest, solarbite].some(isNaN) || starfallChest === 0) {
      return interaction.reply({
        content:
          '❌ Values must be numbers and chest size cannot be zero. Example: `5m 340k 30`',
        ephemeral: true,
      });
    }

    // Correct formula:
    const trueValue = solarbite * (starfallCost / starfallChest);
    const afterMarket = trueValue / 0.94;

    const formattedTrue = Number(trueValue).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedAfter = Number(afterMarket).toLocaleString(undefined, { maximumFractionDigits: 2 });

    await interaction.reply({
      content:
        `🌟 Solarbite Break Even Value for \`${userInput}\`:\n` +
        `• True Value: **${formattedTrue}**\n` +
        `• Market Value (6%~): **${formattedAfter}**`
    });
  }
};
