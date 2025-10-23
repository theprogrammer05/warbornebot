export default {
  name: 'equip',
  description: 'Shows Equip Tier info',
  execute(interaction) {
    const equipData = `
Tier 8: 36,400
Tier 9: 47,300
Tier 10: 61,500
Tier 11: 79,900
`;
    interaction.reply(equipData);
  }
};
