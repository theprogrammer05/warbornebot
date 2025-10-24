import fs from 'fs';
import path from 'path';

const faqFile = path.join(process.cwd(), 'faq.json');

export default {
  name: 'faq',
  description: 'Manage or view FAQs',
  // Declare your subcommands here
  subcommands: [
    { name: 'list', description: 'List all FAQs' },
    {
      name: 'add',
      description: 'Add a new FAQ',
      options: [
        { name: 'question', type: 3, description: 'FAQ question', required: true },
        { name: 'answer', type: 3, description: 'FAQ answer', required: true }
      ]
    },
    {
      name: 'remove',
      description: 'Remove an FAQ by index',
      options: [
        { name: 'index', type: 4, description: 'Index of FAQ to remove', required: true }
      ]
    },
    {
      name: 'search',
      description: 'Search FAQs',
      options: [
        { name: 'term', type: 3, description: 'Search term', required: true }
      ]
    }
  ],

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    let faqs = [];
    if (fs.existsSync(faqFile)) {
      faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    }

    switch (subcommand) {
      case 'list':
        if (!faqs.length) return interaction.reply('❌ No FAQs yet.');
        return interaction.reply(
          faqs.map((f, i) => `**${i + 1}.** Q: ${f.question} | A: ${f.answer}`).join('\n')
        );

      case 'add':
        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');
        faqs.push({ question, answer });
        fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
        return interaction.reply(`✅ Added FAQ: Q: "${question}" | A: "${answer}"`);

      case 'remove':
        const index = interaction.options.getInteger('index') - 1;
        if (index < 0 || index >= faqs.length)
          return interaction.reply('❌ Invalid index.');
        const removed = faqs.splice(index, 1)[0];
        fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
        return interaction.reply(`✅ Removed FAQ: Q: "${removed.question}"`);

      case 'search':
        const term = interaction.options.getString('term').toLowerCase();
        const results = faqs.filter(f => f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term));
        if (!results.length) return interaction.reply('❌ No matches found.');
        return interaction.reply(results.map(f => `Q: ${f.question} | A: ${f.answer}`).join('\n'));
    }
  }
};
