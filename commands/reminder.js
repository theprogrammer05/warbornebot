/**
 * REMINDER COMMAND
 * 
 * Purpose: Manage persistent reminders that mention users/roles when time is up
 * 
 * Subcommands:
 * - add: Create a new reminder
 * - view: Display all your active reminders
 * - remove: Remove a reminder by description
 * 
 * Features:
 * - Set custom time (days, hours, minutes, seconds)
 * - Mention up to 3 users or roles
 * - Optional @everyone mention
 * - Creator is always mentioned
 * - Persists across bot restarts via reminders.json
 * - Private responses
 * 
 * Example Usage:
 * /wb-reminder add description:"Check the oven" days:0 hours:1 minutes:30 seconds:0
 * /wb-reminder add description:"Team meeting" days:0 hours:0 minutes:15 seconds:0 mention1:@JohnDoe
 * /wb-reminder view
 * /wb-reminder remove number:2
 * 
 * Permissions: Everyone (can only manage own reminders)
 * Data Storage: reminders.json (synced to GitHub)
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { scheduleReminder, loadReminders, saveReminders, removeReminder } from '../utils/reminderManager.js';

export default {
  name: 'wb-reminder',
  description: 'Manage your reminders',
  options: [
    {
      name: 'add',
      type: 1,
      description: 'Create a new reminder',
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
      ]
    },
    {
      name: 'view',
      type: 1,
      description: 'View all your active reminders',
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove a reminder by number',
      options: [
        { 
          name: 'number', 
          type: 4, // INTEGER
          description: 'The reminder number to remove (use /wb-reminder view to see numbers)', 
          required: true,
          min_value: 1
        },
      ],
    },
  ],
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    
    // Handle view subcommand
    if (sub === 'view') {
      return this.viewReminders(interaction);
    }
    
    // Handle remove subcommand
    if (sub === 'remove') {
      return this.removeReminderByDescription(interaction);
    }
    
    // Handle add subcommand
    if (sub === 'add') {
      return this.addReminder(interaction);
    }
  },
  
  async addReminder(interaction) {
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
    
    // Create reminder ID
    const reminderId = `${interaction.user.id}_${Date.now()}`;
    
    // Add a button to cancel the reminder
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_reminder_${reminderId}`)
        .setLabel('Cancel Reminder')
        .setStyle(ButtonStyle.Danger)
    );
    
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
    
    // Send private confirmation message
    await interaction.reply({
      content: 
        `✅ **Reminder Created!**\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⏰ **Time:** ${timeString}\n` +
        `📢 **Reminder:** ${description}`,
      flags: MessageFlags.Ephemeral
    });
    
    console.log(`✅ Saved and scheduled reminder for ${interaction.user.tag} (mentioning ${mentionString}) in ${timeString}: ${description}`);
    
    // Send the detailed ephemeral message with the embed and cancel button
    await interaction.followUp({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  },
  
  async viewReminders(interaction) {
    try {
      const reminders = loadReminders();
      
      // Filter reminders for this user
      const userReminders = reminders.filter(r => r.userId === interaction.user.id);
      
      if (userReminders.length === 0) {
        return interaction.reply({
          content: '📭 **No Active Reminders**\n\nYou don\'t have any active reminders.',
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Sort by trigger time (soonest first)
      userReminders.sort((a, b) => a.triggerTime - b.triggerTime);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#00d4ff')
        .setTitle('⏰ Your Active Reminders')
        .setDescription(`You have **${userReminders.length}** active reminder${userReminders.length > 1 ? 's' : ''}`)
        .setTimestamp();
      
      // Add each reminder as a field
      userReminders.forEach((reminder, index) => {
        const now = Date.now();
        const timeRemaining = reminder.triggerTime - now;
        
        // Calculate time remaining
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        // Format time remaining
        const timeParts = [];
        if (days > 0) timeParts.push(`${days}d`);
        if (hours > 0) timeParts.push(`${hours}h`);
        if (minutes > 0) timeParts.push(`${minutes}m`);
        const timeString = timeParts.length > 0 ? timeParts.join(' ') : 'Less than 1m';
        
        // Format trigger time
        const formattedTime = `<t:${Math.floor(reminder.triggerTime / 1000)}:F>`;
        
        // Determine mention display
        let mentionDisplay = reminder.mentionString || `<@${reminder.userId}>`;
        if (mentionDisplay === `<@${reminder.userId}>`) {
          mentionDisplay = 'You';
        }
        
        embed.addFields({
          name: `${index + 1}. ${reminder.description}`,
          value: 
            `⏱️ **In:** ${timeString}\n` +
            `📅 **When:** ${formattedTime}\n` +
            `👤 **Mentions:** ${mentionDisplay}`,
          inline: false
        });
      });
      
      embed.setFooter({ text: 'Use /wb-reminder add to create a new reminder or /wb-reminder remove to delete one' });
      
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      
    } catch (error) {
      console.error('Error viewing reminders:', error);
      await interaction.reply({
        content: '❌ An error occurred while loading your reminders.',
        flags: MessageFlags.Ephemeral
      });
    }
  },
  
  async removeReminderByDescription(interaction) {
    try {
      const number = interaction.options.getInteger('number');
      const reminders = loadReminders();
      
      // Filter and sort user's reminders (same as view command)
      const userReminders = reminders.filter(r => r.userId === interaction.user.id);
      
      if (userReminders.length === 0) {
        return interaction.reply({
          content: 
            `❌ **No Reminders Found**\n\n` +
            `You don't have any active reminders to remove.`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Sort by trigger time (soonest first) - same order as view
      userReminders.sort((a, b) => a.triggerTime - b.triggerTime);
      
      // Check if number is valid
      if (number < 1 || number > userReminders.length) {
        return interaction.reply({
          content: 
            `❌ **Invalid Reminder Number**\n\n` +
            `Please enter a number between 1 and ${userReminders.length}.\n\n` +
            `Use \`/wb-reminder view\` to see your active reminders.`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Get the reminder at the specified position (number - 1 for 0-indexed array)
      const reminder = userReminders[number - 1];
      
      // Remove the reminder
      await removeReminder(reminder.id);
      
      await interaction.reply({
        content: 
          `✅ **Reminder Removed!**\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📢 **Removed #${number}:** ${reminder.description}`,
        flags: MessageFlags.Ephemeral
      });
      
      console.log(`🗑️ User ${interaction.user.tag} removed reminder #${number}: ${reminder.description}`);
      
    } catch (error) {
      console.error('Error removing reminder:', error);
      await interaction.reply({
        content: '❌ An error occurred while removing the reminder.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
