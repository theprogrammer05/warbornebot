export default {
  name: 'drifter',
  description: 'Shows Drifter tiers and corresponding values.',
  execute(interaction) {
    const response = `\`\`\`
Tier | Exergy
-----|--------
VIII | 36,400
IX   | 47,300
X    | 61,500
XI   | 79,900
\`\`\``;

    interaction.reply(response);
  }
};
