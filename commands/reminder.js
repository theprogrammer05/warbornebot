/**
 * Reminder Command
 * Allows users to set reminders at specific CST times with customizable mentions.
 * Reminders persist across bot restarts and can be viewed/removed by the creator.
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { scheduleReminder, loadReminders, saveReminders, removeReminder } from '../utils/reminderManager.js';
import { getCentralTime, createCentralDate } from '../utils/timeUtils.js';

export default {
  name: 'wb-reminder',
  description: 'Set reminders at specific CST times with user mentions',
  options: [
    {
      name: 'add',
      type: 1,
      description: 'Create a reminder at a specific CST time',
      options: [
        {
          name: 'description',
          type: 3,
          description: 'What is this reminder for?',
          required: true
        },
        {
          name: 'date',
          type: 3,
          description: 'Date in MM/DD/YYYY format (e.g., 12/25/2025)',
          required: true
        },
        {
          name: 'time',
          type: 3,
          description: 'Time in CST (e.g., 6:00 PM, 14:30)',
          required: true
        },
        {
          name: 'mention1',
          type: 9,
          description: 'User or role to mention (creator always mentioned)',
          required: false
        },
        {
          name: 'mention2',
          type: 9,
          description: 'Additional user or role to mention',
          required: false
        },
        {
          name: 'mention3',
          type: 9,
          description: 'Additional user or role to mention',
          required: false
        },
        {
          name: 'mention_everyone',
          type: 5,
          description: 'Mention @everyone',
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
    
    if (sub === 'view') return this.viewReminders(interaction);
    if (sub === 'remove') return this.removeReminderByDescription(interaction);
    if (sub === 'add') return this.addReminder(interaction);
  },
  
  async addReminder(interaction) {
    const description = interaction.options.getString('description');
    const dateStr = interaction.options.getString('date');
    const timeStr = interaction.options.getString('time');
    
    const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dateMatch) {
      return interaction.reply({
        content: '❌ **Invalid Date Format**\nUse MM/DD/YYYY format (e.g., 12/25/2025)',
        flags: MessageFlags.Ephemeral
      });
    }
    
    const [_, month, day, year] = dateMatch;
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!timeMatch) {
      return interaction.reply({
        content: '❌ **Invalid Time Format**\nUse HH:MM AM/PM or 24-hour format (e.g., 6:00 PM or 18:00)',
        flags: MessageFlags.Ephemeral
      });
    }
    
    let [__, hours, minutes, period] = timeMatch;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    if (period) {
      period = period.toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    }
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return interaction.reply({
        content: '❌ **Invalid Time**\nHours must be 0-23, minutes must be 0-59',
        flags: MessageFlags.Ephemeral
      });
    }
    
    // Use DST-aware date creation (automatically handles CST/CDT)
    const triggerTime = createCentralDate(year, month, day, hours, minutes);
    
    if (isNaN(triggerTime.getTime())) {
      return interaction.reply({
        content: '❌ **Invalid Date**\nPlease check your date and try again',
        flags: MessageFlags.Ephemeral
      });
    }
    
    const now = getCentralTime();
    if (triggerTime <= now) {
      return interaction.reply({
        content: '❌ **Time Must Be In The Future**\nReminder time must be after the current CST time',
        flags: MessageFlags.Ephemeral
      });
    }
    
    if (triggerTime.getTime() > now.getTime() + (30 * 24 * 60 * 60 * 1000)) {
      return interaction.reply({
        content: '❌ **Time Limit Exceeded**\nMaximum reminder time is 30 days from now',
        flags: MessageFlags.Ephemeral
      });
    }
    
    const mentionedEntities = [];
    for (let i = 1; i <= 3; i++) {
      const mentionable = interaction.options.getMentionable(`mention${i}`);
      if (mentionable) mentionedEntities.push(mentionable);
    }
    
    const mentionEveryone = interaction.options.getBoolean('mention_everyone');
    let mentionString;
    
    if (mentionEveryone) {
      mentionString = '@everyone';
    } else {
      const mentions = [`<@${interaction.user.id}>`];
      mentionedEntities.forEach(entity => {
        if (entity.id !== interaction.user.id) {
          const mentionFormat = entity.constructor.name === 'Role' ? `<@&${entity.id}>` : `<@${entity.id}>`;
          mentions.push(mentionFormat);
        }
      });
      mentionString = mentions.join(' ');
    }
    
    const formattedTime = `<t:${Math.floor(triggerTime.getTime() / 1000)}:F>`;
    const embed = new EmbedBuilder()
      .setColor('#00d4ff')
      .setTitle('⏰ Reminder Set Successfully!')
      .setDescription(`📢 **I'll remind you about:**\n> ${description}`)
      .addFields({ name: '📅 Reminder Time (CST)', value: formattedTime, inline: false })
      .setFooter({ text: 'You will be mentioned when the time arrives!' })
      .setTimestamp(triggerTime);
    
    const reminderId = `${interaction.user.id}_${Date.now()}`;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cancel_reminder_${reminderId}`)
        .setLabel('Cancel Reminder')
        .setStyle(ButtonStyle.Danger)
    );
    
    const reminders = loadReminders();
    const newReminder = {
      id: reminderId,
      userId: interaction.user.id,
      mentionString,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      description,
      triggerTime: triggerTime.getTime(),
      createdAt: Date.now()
    };
    reminders.push(newReminder);
    await saveReminders(reminders);
    
    scheduleReminder(interaction.client, newReminder, false);
    
    await interaction.reply({
      content: 
        `✅ **Reminder Created!**\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📅 **Date:** ${dateStr}\n` +
        `⏰ **Time:** ${timeStr} CST\n` +
        `📢 **Reminder:** ${description}`,
      flags: MessageFlags.Ephemeral
    });
    
    console.log(`✅ Reminder set for ${interaction.user.tag} at ${triggerTime.toLocaleString('en-US', { timeZone: 'America/Chicago' })}: ${description}`);
    
    await interaction.followUp({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  },
  
  async viewReminders(interaction) {
    try {
      const reminders = loadReminders();
      
      const userReminders = reminders.filter(r => r.userId === interaction.user.id);
      
      if (!userReminders.length) {
        return interaction.reply({
          content: '📭 **No Active Reminders**\n\nYou don\'t have any active reminders.',
          flags: MessageFlags.Ephemeral
        });
      }
      
      userReminders.sort((a, b) => a.triggerTime - b.triggerTime);
      
      const embed = new EmbedBuilder()
        .setColor('#00d4ff')
        .setTitle('⏰ Your Active Reminders')
        .setDescription(`You have **${userReminders.length}** active reminder${userReminders.length > 1 ? 's' : ''}`)
        .setTimestamp();
      
      userReminders.forEach((reminder, index) => {
        const now = Date.now();
        const timeRemaining = reminder.triggerTime - now;
        
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeParts = [];
        if (days > 0) timeParts.push(`${days}d`);
        if (hours > 0) timeParts.push(`${hours}h`);
        if (minutes > 0) timeParts.push(`${minutes}m`);
        const timeString = timeParts.length > 0 ? timeParts.join(' ') : 'Less than 1m';
        
        const formattedTime = `<t:${Math.floor(reminder.triggerTime / 1000)}:F>`;
        
        let mentionDisplay = reminder.mentionString || `<@${reminder.userId}>`;
        if (mentionDisplay === `<@${reminder.userId}>`) {
          mentionDisplay = 'You';
        }
        
        embed.addFields({
          name: `${index + 1}. ${reminder.description}`,
          value: 
            `📅 **When:** ${formattedTime} _(${timeString})_\n` +
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
      
      const userReminders = reminders.filter(r => r.userId === interaction.user.id);
      
      if (!userReminders.length) {
        return interaction.reply({
          content: `❌ **No Reminders Found**\n\nYou don't have any active reminders to remove.`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      userReminders.sort((a, b) => a.triggerTime - b.triggerTime);
      
      if (number < 1 || number > userReminders.length) {
        return interaction.reply({
          content: 
            `❌ **Invalid Reminder Number**\n\n` +
            `Please enter a number between 1 and ${userReminders.length}.\n\n` +
            `Use \`/wb-reminder view\` to see your active reminders.`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      const reminder = userReminders[number - 1];
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
