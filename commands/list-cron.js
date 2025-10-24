export default {
  name: 'list-cron',
  description: 'Lists all active scheduled cron jobs.',
  async execute(interaction, client, { cronJobs }) {
    // Admin check
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to list cron jobs.',
        ephemeral: true,
      });
    }

    if (!cronJobs.length) {
      return interaction.reply({
        content: 'ℹ️ There are no active cron jobs.',
        ephemeral: true,
      });
    }

    const jobStatuses = cronJobs.map((job, index) => `• Job #${index + 1}: ${job.getStatus()}`).join('\n');

    await interaction.reply({
      content: `📜 **Active Cron Jobs:**\n${jobStatuses}`,
      ephemeral: true,
    });
  },
};
