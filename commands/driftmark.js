export default {
  name: 'driftmark',
  description: 'Shows Driftmark tiers and Exergy/Starfall values.',
  execute(interaction) {
    const response = `\`\`\`
Tier | Exergy   | Starfall   | Duration
-----|----------|------------|----------
V    | 1,400    | 17,300     | 20 min
VI   | 12,000   | 41,300     | 4 hr
VII  | 30,000   | 282,000    | 1 day 18 hr
VIII | 45,000   | 812,000    | 3 days
IX   | 60,000   | 3,890,000  | 3 days
X    | 90,000   | 6,000,000  | 3 days
\`\`\``;

    interaction.reply(response);
  }
};
