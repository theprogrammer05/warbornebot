/**
 * FAQ COMMAND
 * 
 * Purpose: Manage and display frequently asked questions
 * 
 * Subcommands:
 * - view: View all FAQ entries (Everyone)
 * - add: Create a new FAQ entry (Admins only)
 * - edit: Modify an existing FAQ entry (Admins only)
 * - delete: Remove an FAQ entry (Admins only)
 * 
 * Features:
 * - Paginated FAQ list with navigation buttons
 * - Rich embeds for better readability
 * - Admin-only modification commands
 * - Persistent storage via faq.json
 * 
 * Example Usage:
 * /wb-faq view
 * /wb-faq add question:"What is the server IP?" answer:"play.example.com"
 * /wb-faq edit question:"How do I join?" new_answer:"Updated answer here"
 * /wb-faq delete question:"Outdated question"
 * 
 * Permissions: View (Everyone), Add/Edit/Delete (Administrators)
 * Data Storage: faq.json (synced to GitHub)
 */

import fs from 'fs';
import path from 'path';
import Discord, { MessageFlags } from 'discord.js';
import { updateGitHubFile } from '../utils/github.js';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = Discord;

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists locally
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

// Helper to paginate FAQs
function paginate(array, pageSize, pageNumber) {
  return array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
}

export default {
  name: 'wb-faq',
  description: 'View or manage FAQs',
  options: [
    {
      name: 'view',
      type: 1,
      description: 'View all FAQs',
    },
    {
      name: 'add',
      type: 1,
      description: 'Add a new FAQ',
      options: [
        { name: 'question', type: 3, description: 'The FAQ question', required: true },
        { name: 'answer', type: 3, description: 'The FAQ answer', required: true },
      ],
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an FAQ by number',
      options: [
        { name: 'number', type: 4, description: 'The number of the FAQ to remove', required: true },
      ],
    },
  ],

  // Method to show FAQ list
  async showFaqList(interaction) {
    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    
    if (!faqs.length) return interaction.reply({ content: '❌ No FAQs found.', flags: MessageFlags.Ephemeral });

    const pageSize = 15;
    let page = 0;

    const getContent = (page) => {
      const faqList = paginate(faqs, pageSize, page)
        .map((faq, i) => 
          `**${i + 1 + page * pageSize}.** 💬 **${faq.question}**\n` +
          `   ➡️ ${faq.answer}`
        )
        .join('\n\n');
      return (
        `📚 **Frequently Asked Questions**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${faqList}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📄 Page **${page + 1}** of **${Math.ceil(faqs.length / pageSize)}** • Total: **${faqs.length}** FAQs\n` +
        `💡 *Use \`/wb-faq add\` to contribute!*`
      );
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(faqs.length <= pageSize)
    );

    const reply = await interaction.reply({
      content: getContent(page),
      components: [row],
      ephemeral: false,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({ 
      componentType: ComponentType.Button, 
      time: 60000 
    });

    collector.on('collect', (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '❌ This is not your FAQ list!', flags: MessageFlags.Ephemeral });
      }

      if (btn.customId === 'next') page++;
      if (btn.customId === 'prev') page--;

      row.components[0].setDisabled(page === 0);
      row.components[1].setDisabled((page + 1) * pageSize >= faqs.length);

      btn.update({ content: getContent(page), components: [row] });
    });

    collector.on('end', () => {
      row.components.forEach((btn) => btn.setDisabled(true));
      interaction.editReply({ components: [row] }).catch(() => {});
    });
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    
    // Handle view subcommand
    if (sub === 'view') {
      return this.showFaqList(interaction);
    }
    
    // Handle subcommands
    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');

      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      await updateGitHubFile('faq.json', faqs, 'Add FAQ via Discord bot');

      return interaction.reply({
        content: 
          `✅ **FAQ Added Successfully!**\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💬 **Question:** ${question}\n` +
          `➡️ **Answer:** ${answer}\n` +
          `🔢 **FAQ #${faqs.length}**`,
      });
    }

    // ---------- REMOVE ----------
    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) return interaction.reply({ content: '❌ Invalid FAQ number.', flags: MessageFlags.Ephemeral });

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      await updateGitHubFile('faq.json', faqs, 'Remove FAQ via Discord bot');

      return interaction.reply({
        content: 
          `✅ **FAQ Removed Successfully!**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💬 **Question:** ${removed.question}\n` +
          `➡️ **Answer:** ${removed.answer}`,
      });
    }
  },
};
