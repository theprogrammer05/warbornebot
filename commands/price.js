export default {
  name: 'price',
  description: 'Calculate Solarbite Break Even Value',
  async execute(interaction) {
    const input = interaction.options.getString('numbers');

    if (!input) {
      return interaction.reply({
        content:
          '❌ Correct format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)` or using spaces\n' +
          'Example: 5000000/340000/30 or 5000000 340000 30',
        ephemeral: true,
      });
    }

    // Split by "/" or spaces and trim
    const parts = input.split(/[\/ ]+/).map(part => part.trim());

    if (parts.length !== 3) {
      return interaction.reply({
        content:
          '❌ Incorrect number of inputs. Format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)` or using spaces',
        ephemeral: true,
      });
    }

    function parseNumber(numStr) {
      let num = numStr.replace(/,/g, '').trim(); // remove commas
      const lastChar = num.slice(-1).toLowerCase();

      if (lastChar === 'k') return parseFloat(num.slice(0, -1)) * 1_000;
      if (lastChar === 'm') return parseFloat(num.slice(0, -1)) * 1_000_000;

      return parseFloat(num);
    }

    const starfallCost = parseNumber(parts[0]);
    const chestSize = parseNumber(parts[1]);
    const solarbiteCost = parseNumber(parts[2]);

    if ([starfallCost, chestSize, solarbiteCost].some(isNaN)) {
      return interaction.reply({
        content:
          '❌ One or more inputs are invalid numbers.\n' +
          'Format: `Starfall Token Cost / Starfall Token Chest / Solarbite Cost (for Chest)` or using spaces',
        ephemeral: true,
      });
    }

    const result = (solarbiteCost * (starfallCost / chestSize)) * 0.94;

    return interaction.reply({
      content: `🌟 Solarbite Break Even Value: ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      ephemeral: false,
    });
  },
};
