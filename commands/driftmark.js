export const driftmarkCommand = {
  name: 'driftmark',
  description: 'Displays Driftmark Tier 5 and equivalents',
  execute: async (message) => {
    const reply = `
\`\`\`
Tier 5: 1,400 Exergy, 17,300 Starfall (20 minutes)
Tier 6: 12,000 Exergy, 41,300 Starfall (4 hours)
Tier 7: 30,000 Exergy, 282,000 Starfall (1 day 18 hr)
Tier 8: 45,000 Exergy, 812,000 Starfall (3 days)
Tier 9: 60,000 Exergy, 3,890,000 Starfall (3 days)
Tier 10: 90,000 Exergy, 6,000,000 Starfall (3 days)
\`\`\`
    `;
    await message.channel.send(reply);
  }
};
