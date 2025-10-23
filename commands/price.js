export default {
  name: 'price',
  description: 'Calculate gear cost from tokens',
  options: [
    {
      name: 'cost',
      type: 10, // NUMBER
      description: 'Starfall Token Cost (NPC)',
      required: true
    },
    {
      name: 'chest',
      type: 10, // NUMBER
      description: 'Starfall Token Chest',
      required: true
    },
    {
      name: 'solarbite',
      type: 10, // NUMBER
      description: 'Solarbite for the chest',
      required: true
    }
  ],
  async execute(interaction) {
    const cost = interaction.options.getNumber('cost');
    const chest = interaction.options.getNumber('chest');
    const solarbite = interaction.options.getNumber('solarbite');

    const result = ((cost / chest) * solarbite) * 0.94;

    await interaction.reply(`Calculated result: ${result.toLocaleString()}`);
  }
};
