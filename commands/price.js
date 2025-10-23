export default {
  name: 'price',
  description: 'Calculates Starfall/Silten cost',
  execute(interaction) {
    // Get options from slash command
    const starfallCost = parseFloat(interaction.options.getString('starfall_token_cost'));
    const chestStarfall = parseFloat(interaction.options.getString('starfall_token_chest'));
    const solarbiteCost = parseFloat(interaction.options.getString('solarbite_cost'));

    if (isNaN(starfallCost) || isNaN(chestStarfall) || isNaN(solarbiteCost)) {
      return interaction.reply('❌ Invalid numbers provided. Use numeric values.');
    }

    const result = ((starfallCost / chestStarfall) * solarbiteCost) * 0.94;
    interaction.reply(`Calculated cost: ${result.toLocaleString()}`);
  }
};
