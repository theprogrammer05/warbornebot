import fs from 'fs';
import path from 'path';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

export default {
  name: 'faq',
  description: 'Manage FAQs (list, add, remove, search)',
  options: [
    { name: 'list', type: 1, description: 'List all FAQs' },
    {
      name: 'add',
      type: 1,
      description: 'Add a new FAQ',
      options: [
        { name: 'question', type: 3, description: 'FAQ question', required: true },
        { name: 'answer', type: 3, description: 'FAQ answer', required: true }
      ]
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an FAQ by index',
      options: [
        { name: 'index', type: 4, description: 'Index of FAQ to remove', required: true }
      ]
    },
    {
      name: 'search',
      type: 1,
      description: 'Search FAQs for a term',
      options: [
        { name: 'term', type: 3, description: 'Search term', required: true }
      ]
    }
  ],
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (subcommand === 'list') {
      if (faqs.length === 0) {
        return interaction.reply({ content: '❌ No FAQs available.', ephemeral: true });
      }
      const formatted = faqs.map((f, i) => `**${i + 1}.** Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      return interaction.reply({ content: formatted, ephemeral: false });
    }

    if (subcommand === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');

      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      return interaction.reply({ content: `✅ Added FAQ: "${question}"`, ephemeral: true });
    }

    if (subcommand === 'remove') {
      const index = interaction.options.getInteger('index') - 1;
      if (index < 0 || index >= faqs.length) {
        return interaction.reply({ content: '❌ Invalid FAQ index.', ephemeral: true });
      }

      const removed = faqs.splice(index, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      return interaction.reply({ content: `✅ Removed FAQ: "${removed.question}"`, ephemeral: true });
    }

    if (subcommand === 'search') {
      const term = interaction.options.getString('term').toLowerCase();
      const results = faqs.filter(f => f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term));

      if (results.length === 0) {
        return interaction.reply({ content: `❌ No FAQs found for "${term}".`, ephemeral: true });
      }

      const formatted = results.map((f, i) => `**${i + 1}.** Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      return interaction.reply({ content: formatted, ephemeral: false });
    }
  }
};
