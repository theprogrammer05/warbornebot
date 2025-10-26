import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export default {
  name: 'wb-reminder',
  description: 'Set a reminder that will mention you when the time is up',
  options: [
    {
      name: 'description',
      type: 3, // STRING
      description: 'What is this reminder for?',
      required: true
    },
    {
      name: 'days',
      type: 4, // INTEGER
      description: 'Number of days',
      required: true,
      min_value: 0
    },
    {
      name: 'hours',
      type: 4, // INTEGER
      description: 'Number of hours',
      required: true,
      min_value: 0,
      max_value: 23
    },
    {
      name: 'minutes',
      type: 4, // INTEGER
      description: 'Number of minutes',
      required: true,
      min_value: 0,
      max_value: 59
    },
    {
      name: 'seconds',
      type: 4, // INTEGER
      description: 'Number of seconds',
      required: true,
      min_value: 0,
      max_value: 59
    }
  ],
  
  async execute(interaction) {
    const days = interaction.options.getInteger('days') || 0;
    const hours = interaction.options.getInteger('hours') || 0;
    const minutes = interaction.options.getInteger('minutes') || 0;
    const seconds = interaction.options.getInteger('seconds') || 0;
    const description = interaction.options.getString('description');
    
    // Calculate total milliseconds
    const totalMs = 
      (days * 24 * 60 * 60 * 1000) +
      (hours * 60 * 60 * 1000) +
      (minutes * 60 * 1000) +
      (seconds * 1000);
    
    // Validate that at least some time was specified
    if (totalMs === 0) {
      return interaction.reply({
        content: '❌ Please specify at least some time for the reminder!',
        ephemeral: true
      });
    }
    
    // Validate maximum time (30 days)
    if (totalMs > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: '❌ Maximum reminder time is 30 days',
        ephemeral: true
      });
    }
    
    // Format time string for display
    const timeParts = [];
    if (days > 0) timeParts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) timeParts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeParts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) timeParts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    
    const timeString = timeParts.join(', ');
    
    // Create a timestamp for when the reminder will trigger
    const now = new Date();
    const triggerTime = new Date(now.getTime() + totalMs);
    
    // Format the timestamp for display
    const formattedTime = `<t:${Math.floor(triggerTime.getTime() / 1000)}:F>`;
    
    // Create an embed to show the reminder details
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('⏰ Reminder Set')
      .setDescription(`I'll remind you ${formattedTime} about:`)
      .addFields(
        { name: 'Reminder', value: description },
        { name: 'Time until reminder', value: timeString }
      )
      .setTimestamp(triggerTime);
    
    // Add a button to cancel the reminder
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_reminder_${interaction.user.id}_${Date.now()}`)
        .setLabel('Cancel Reminder')
        .setStyle(ButtonStyle.Danger)
    );
    
    // Send the initial response
    await interaction.reply({
      content: `⏰ I'll remind you in ${timeString} about: ${description}`,
      ephemeral: true
    });
    
    // Set the timeout
    const timeout = setTimeout(async () => {
      try {
        await interaction.followUp({
          content: `⏰ <@${interaction.user.id}>, Drifter, this is your reminder for: ${description}`,
          ephemeral: false
        });
      } catch (error) {
        console.error('Error sending reminder:', error);
      }
    }, totalMs);
    
    // Store the timeout so it can be cancelled
    // In a real implementation, you'd want to store this in a Map or database
    // to handle bot restarts and multiple reminders
    if (!interaction.client.reminders) {
      interaction.client.reminders = new Map();
    }
    
    const reminderId = `reminder_${interaction.user.id}_${Date.now()}`;
    interaction.client.reminders.set(reminderId, {
      timeout,
      userId: interaction.user.id,
      channelId: interaction.channelId,
      description,
      triggerTime: triggerTime.getTime(),
      cancel: () => {
        clearTimeout(timeout);
        interaction.client.reminders.delete(reminderId);
      }
    });
    
    // For now, we'll just log that we've set the reminder
    console.log(`Set reminder for ${interaction.user.tag} in ${timeString}: ${description}`);
    
    // Send the ephemeral message with the embed
    await interaction.followUp({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
