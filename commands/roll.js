export default {
  name: 'roll',
  description: 'Rolls a dice from 1 to 6',
  async execute(interaction) {
    const roll = Math.floor(Math.random() * 6) + 1;
    await interaction.reply(`🎲 You rolled a ${roll}!`);
  },
};
