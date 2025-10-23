export default {
  name: 'price',
  description: 'Calculate Gear Cost: Starfall Cost, Chest Size, Solarbite Cost',
  async execute(interaction) {
    const msg = interaction.options?.getString?.('input') || interaction.content || '';

    if (!msg) {
      return interaction.reply(
        '❌ Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
        'Example: `5000000,340000,30`'
      );
    }

    try {
      const parts = msg.replace(/\s+/g, '').split(',');
      if (parts.length !== 3) throw new Error();

      const [starfallCost, chestSize, solarbiteCost] = parts.map(Number);
      if (parts.some(isNaN)) throw new Error();

      const result = ((starfallCost / chestSize) * solarbiteCost) * 0.94;
      return interaction.reply(`💰 Result: ${result.toLocaleString()}`);
    } catch {
      return interaction.reply(
        '❌ Invalid input!\n' +
        'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
        'Example: `5000000,340000,30`'
      );
    }
  }
};
