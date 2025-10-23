export default {
  name: 'price',
  description: 'Calculates Gear Cost. Comma-delimited numbers.',
  async execute(interaction) {
    try {
      // Get the input string
      const input = interaction.options.getString('numbers') || '';
      const cleanInput = input.replace(/\s/g, ''); // remove all spaces

      // Split by comma
      const parts = cleanInput.split(',');
      if (parts.length !== 3) {
        await interaction.reply(
          '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
          'Example: 5000000,340000,30'
        );
        return;
      }

      const [starfallCost, chestSize, solarbite] = parts.map(Number);

      if (parts.some(isNaN)) {
        await interaction.reply(
          '❌ All three values must be numbers.\n' +
          'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
          'Example: 5000000,340000,30'
        );
        return;
      }

      const result = ((starfallCost / chestSize) * solarbite) * 0.94;

      await interaction.reply(`💰 Calculated value: **${result.toLocaleString()}**`);
    } catch (err) {
      console.error(err);
      await interaction.reply('❌ There was an error calculating the price.');
    }
  }
};
