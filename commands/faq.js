export default {
  name: 'faq',
  description: 'Add faq here.',
  execute(interaction) {
    const response = `\`\`\`
Ask Kyle
\`\`\``;

    interaction.reply(response);
  },
};
