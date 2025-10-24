export default {
  name: 'commands',
  description: 'Shows a list of all bot commands.',
  async execute(interaction) {
    const commands = interaction.client.commands;
    if (!commands) return interaction.reply('❌ No commands found.');

    const commandList = commands
      .map(cmd => `• **${cmd.name}**: ${cmd.description}`)
      .join('\n');

    await interaction.reply({
      content: `📜 **Available Commands:**\n${commandList}`,
      ephemeral: true, // only visible to the user
    });
  },
};
