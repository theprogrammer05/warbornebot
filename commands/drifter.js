export const drifterCommand = {
  name: 'drifter',
  description: 'Displays Drifter Tiers 8-11',
  execute: async (message) => {
    const reply = `
\`\`\`
Tier 8: 36,400
Tier 9: 47,300
Tier 10: 61,500
Tier 11: 79,900
\`\`\`
    `;
    await message.channel.send(reply);
  }
};
