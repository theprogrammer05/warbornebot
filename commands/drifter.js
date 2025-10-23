export default {
  name: 'drifter',
  description: 'Shows Drifter Tier info',
  execute(interaction) {
    const drifterData = `
Tier 8: 36,400
Tier 9: 47,300
Tier 10: 61,500
Tier 11: 79,900
`;
    interaction.reply(drifterData);
  }
};
