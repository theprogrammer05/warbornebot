import fs from 'fs';
import path from 'path';

export default {
  name: 'faq-search',
  description: 'Search FAQ items by keyword. Example: /faq-search keyword:"start"',
  options: [
    {
      name: 'keyword',
      type: 3, // STRING
      description: 'Keyword to search for in questions or answers. Example: "start"',
      required: true,
    },
  ],
  async execute(interaction) {
    const keyword = interaction.options.getString('keyword').toLowerCase();
    const faqFile = path.join(process.cwd(), 'faq.json');

    if (!fs.existsSync(faqFile)) {
      return interaction.reply({
        content: '❌ FAQ file not found.',
        ephemeral: true,
      });
    }

    const faq = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    const results = faq
      .map((item, index) => ({ ...item, index: index + 1 }))
      .filter(
        item =>
          item.question.toLowerCase().includes(keyword) ||
          item.answer.toLowerCase().includes(keyword)
      );

    if (!results.length) {
      return interaction.reply({
        content: `ℹ️ No FAQ items found containing "${keyword}".`,
        ephemeral: true,
      });
    }

    const lines = results
      .map(item => `**${item.index}. Q:** ${item.question}\n**A:** ${item.answer}`)
      .join('\n\n');

    await interaction.reply({
      content: `🔍 **FAQ Search Results for "${keyword}":**\n\n${lines}`,
      ephemeral: false,
    });
  },
};
