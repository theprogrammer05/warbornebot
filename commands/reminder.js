import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { scheduleReminder, loadReminders, saveReminders } from '../utils/reminderManager.js';

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
    },
    {
      name: 'mention1',
      type: 9, // MENTIONABLE (users or roles)
      description: 'Additional user/role to mention (you are always mentioned)',
      required: false
    },
    {
      name: 'mention2',
      type: 9, // MENTIONABLE (users or roles)
      description: 'Additional user/role to mention',
      required: false
    },
    {
      name: 'mention3',
      type: 9, // MENTIONABLE (users or roles)
      description: 'Additional user/role to mention',
      required: false
    },
    {
      name: 'mention_everyone',
      type: 5, // BOOLEAN
      description: 'Mention @everyone (optional)',
      required: false
    }
  ],
  
  async execute(interaction) {
    const days = interaction.options.getInteger('days') || 0;
    const hours = interaction.options.getInteger('hours') || 0;
    const minutes = interaction.options.getInteger('minutes') || 0;
    const seconds = interaction.options.getInteger('seconds') || 0;
    const description = interaction.options.getString('description');
    
    // Collect all mentioned users/roles
    const mentionedEntities = [];
    for (let i = 1; i <= 3; i++) {
      const mentionable = interaction.options.getMentionable(`mention${i}`);
      if (mentionable) {
        mentionedEntities.push(mentionable);
      }
    }
    
    // Check if @everyone was requested
    const mentionEveryone = interaction.options.getBoolean('mention_everyone');
    
    // Build mention string - ALWAYS include the creator
    let mentionString;
    if (mentionEveryone) {
      // @everyone already mentions everyone including the creator
      mentionString = '@everyone';
    } else {
      // Always start with the creator
      const mentions = [`<@${interaction.user.id}>`];
      
      // Add additional mentioned users/roles (avoid duplicate users)
      mentionedEntities.forEach(entity => {
        // Check if it's a user and if it's the creator
        if (entity.id !== interaction.user.id) {
          // For roles, use <@&roleId>, for users use <@userId>
          const mentionFormat = entity.constructor.name === 'Role' 
            ? `<@&${entity.id}>` 
            : `<@${entity.id}>`;
          mentions.push(mentionFormat);
        }
      });
      
      mentionString = mentions.join(' ');
    }
    
    // Calculate total milliseconds
    const totalMs = 
      (days * 24 * 60 * 60 * 1000) +
      (hours * 60 * 60 * 1000) +
      (minutes * 60 * 1000) +
      (seconds * 1000);
    
    // Validate that at least some time was specified
    if (totalMs === 0) {
      return interaction.reply({
        content: '❌ **Invalid Time**\n⏱️ Please specify at least some time for the reminder!',
        flags: MessageFlags.Ephemeral
      });
    }
    
    // Validate maximum time (30 days)
    if (totalMs > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: '❌ **Time Limit Exceeded**\n⏱️ Maximum reminder time is **30 days**',
        flags: MessageFlags.Ephemeral
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
      .setColor('#00d4ff')
      .setTitle('⏰ Reminder Set Successfully!')
      .setDescription(`📢 **I'll remind you about:**\n> ${description}`)
      .addFields(
        { name: '📅 Reminder Time', value: formattedTime, inline: false },
        { name: '⏱️ Time Until Reminder', value: `🕒 ${timeString}`, inline: false }
      )
      .setFooter({ text: 'You will be mentioned when the time is up!' })
      .setTimestamp(triggerTime);
    
    // Add a button to cancel the reminder
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_reminder_${interaction.user.id}_${Date.now()}`)
        .setLabel('Cancel Reminder')
        .setStyle(ButtonStyle.Danger)
    );
    
    // Create reminder ID
    const reminderId = `${interaction.user.id}_${Date.now()}`;
    
    // Save reminder to JSON file
    const reminders = loadReminders();
    const newReminder = {
      id: reminderId,
      userId: interaction.user.id,
      mentionString: mentionString,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      description,
      triggerTime: triggerTime.getTime(),
      createdAt: Date.now()
    };
    reminders.push(newReminder);
    await saveReminders(reminders);
    
    // Schedule the reminder
    scheduleReminder(interaction.client, newReminder, false);
    
    // Send the initial response
    let displayMention;
    if (mentionString === '@everyone') {
      displayMention = '@everyone';
    } else if (mentionString === `<@${interaction.user.id}>`) {
      displayMention = 'you';
    } else {
      // Show "you + others"
      const otherMentions = mentionedEntities
        .filter(entity => entity.id !== interaction.user.id)
        .map(entity => {
          return entity.constructor.name === 'Role' 
            ? `<@&${entity.id}>` 
            : `<@${entity.id}>`;
        })
        .join(' ');
      displayMention = otherMentions ? `you + ${otherMentions}` : 'you';
    }
    
    await interaction.reply({
      content: 
        `✅ **Reminder Created!**\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⏰ **Timer:** ${timeString}\n` +
        `📢 **Reminder:** ${description}`
    });
    
    console.log(`✅ Saved and scheduled reminder for ${interaction.user.tag} (mentioning ${mentionString}) in ${timeString}: ${description}`);
    
    // Send the ephemeral message with the embed
    await interaction.followUp({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
