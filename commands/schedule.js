export default {
  name: 'schedule',
  description: 'Shows the weekly event schedule.',
  execute(interaction) {
    const response = `\`\`\`
📅 Weekly Schedule
--------------------------
Saturday:  Start of Season
Sunday:    Double Scrap Post
Monday:    100% Harvest Vault EXP & Chest Rewards
Tuesday:   Exergy Event (10:30 AM, 3:30 PM, & 9:30 PM CST)
Wednesday: 50% Experience (Do highest Trial before 10:00 AM CST)
Thursday:  Radiation Storm
\`\`\``;

    interaction.reply(response);
  },
};
