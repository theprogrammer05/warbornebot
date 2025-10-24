import { EmbedBuilder } from 'discord.js';

export default {
  name: 'flow-diagram',
  description: 'Shows the bot flow and data structure for commands, JSON files, and cron jobs.',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Flow Overview')
      .setColor(0x00ffff)
      .setDescription('A visual overview of how commands, JSON data, and cron jobs interact in the bot.')
      .addFields(
        {
          name: '1️⃣ Commands (commands/)',
          value: `• /price, /driftmark, /drifter, /equip → Display tier/calculation info\n` +
                 `• /season-start → View or add/update schedule events\n` +
                 `• /faq → View FAQ items\n` +
                 `• /faq-add → Add new FAQ\n` +
                 `• /faq-remove → Remove FAQ\n` +
                 `• /faq-search → Search FAQ by keyword\n` +
                 `• /flow-diagram → Show this flow diagram`,
        },
        {
          name: '2️⃣ Data Storage',
          value: `• schedule.json → Stores events by weekday\n` +
                 `• faq.json → Stores FAQ questions & answers`,
        },
        {
          name: '3️⃣ Cron Jobs (index.js)',
          value: `• Daily message job → Posts today’s schedule at 9:00 AM\n` +
                 `• cronJobs[] → Array holding all scheduled jobs\n` +
                 `• /clear-cron → Stop all jobs`,
        },
        {
          name: '4️⃣ Discord Interaction Flow',
          value: `• User sends a slash command\n` +
                 `• index.js dynamically loads commands\n` +
                 `• Executes command logic\n` +
                 `• Reads/writes JSON files as needed`,
        },
        {
          name: '🌐 Environment Variables',
          value: `• DISCORD_TOKEN\n• CLIENT_ID\n• GUILD_ID\n• ANNOUNCE_CHANNEL_ID`,
        },
        {
          name: '💡 Notes',
          value: `• Admin-only commands: /faq-add, /faq-remove, /season-start (with add_event)\n` +
                 `• All dynamic data persists in JSON, no code edits needed for updates`,
        }
      )
      .setFooter({ text: 'Bot System Flow Diagram' });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
