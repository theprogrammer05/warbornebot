export default {
  name: 'clear-cron',
  description: 'Stops all active scheduled cron jobs.',
  async execute(interaction, client, { cronJobs }) {
    // Admin check
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to stop cron jobs.',
        ephemeral: true,
      });
    }

    if (!cronJobs.length) {
      return interaction.reply({
        content: 'ℹ️ No active cron jobs to stop.',
        ephemeral: true,
      });
    }

    cronJobs.forEach(job => job.stop());
    cronJobs.length = 0; // clear the array

    await interaction.reply({
      content: '✅ All scheduled cron jobs have been stopped.',
      ephemeral: false,
    });
  },
};
