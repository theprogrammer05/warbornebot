export const priceCommand = {
  name: 'price',
  description: 'Calculates ((Starfall Token Cost / Starfall Token Chest) * Solarbite Cost) * 0.94',
  options: [
    {
      name: 'starfall_token_cost',
      type: 10, // NUMBER (allows decimals)
      description: 'Cost of Starfall Token at NPC',
      required: true
    },
    {
      name: 'starfall_token_chest',
      type: 10, // NUMBER
      description: 'Number of Starfall Tokens in a chest',
      required: true
    },
    {
      name: 'solarbite_cost',
      type: 10, // NUMBER
      description: 'Cost of Solarbite for chest',
      required: true
    }
  ],
  execute: async (interaction) => {
    const tokenCost = interaction.options.getNumber('starfall_token_cost');
    const chestTokens = interaction.options.getNumber('starfall_token_chest');
    const solarbiteCost = interaction.options.getNumber('solarbite_cost');

    if (chestTokens === 0) {
      return interaction.reply('❌ Starfall Token Chest cannot be zero.');
    }

    const result = ((tokenCost / chestTokens) * solarbiteCost) * 0.94;

    await interaction.reply(`✅ Result: ${result.toLocaleString()}`);
  }
};
