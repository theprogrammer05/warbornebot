export default {
  name: 'hello',
  description: 'Greets the user!',
  async execute(interaction) {
    await interaction.reply(`Hello, ${interaction.user.username}! 👋`);
  },
};
