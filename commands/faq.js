import fs from 'fs';
import path from 'path';

export default {
  name: 'faq',
  description: 'Displays all FAQ items with instructions for adding, removing, or searching them.',
  async execute(interaction) {
    const faqFile = path.join(process.cwd(), 'faq.json');

    if (!fs.existsSync(faqFile)) {
      return interaction.reply({
        content: '❌ FAQ file not found.',
        ephemeral: true,
      });
    }

    const faq = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (!faq.length) {
      return interaction.reply({
        content:
          'ℹ️ There are no FAQ items yet.\nYou can add one using `/faq-add question:"..." answer:"..."`',
        ephemeral: true,
      });
    }

    const header = `📖 **FAQ:**\n` +
      `*Use /faq-add to add, /faq-remove to remove, or /faq-search to find specific items.*\n\n`;

    const lines = faq
      .map((item, index) =>
        `**${index + 1}. Q:** ${item.question}\n**A:** ${item.answer}`
      )
      .join('\n\n');

    await interaction.reply({
      content: header + lines,
      ephemeral: false,
    });
  },
};
