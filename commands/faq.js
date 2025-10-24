import fs from 'fs';
import path from 'path';

export default {
  name: 'faq',
  description: 'Manage FAQs dynamically. Use subcommands: list, add, remove.',
  subcommands: [
    {
      name: 'list',
      description: 'List all FAQs.'
    },
    {
      name: 'add',
      description: 'Add a new FAQ.',
      options: [
        { name: 'question', type: 3, description: 'The FAQ question', required: true },
        { name: 'answer', type: 3, description: 'The FAQ answer', required: true }
      ]
    },
    {
      name: 'remove',
      description: 'Remove an FAQ by its number.',
      options: [
        { name: 'number', type: 4, description: 'The FAQ number to remove', required: true }
      ]
    }
  ],
  async execute(interaction) {
    const faqFile = path.join(process.cwd(), 'faq.json');
    if (!fs.existsSync(faqFile)) fs.writeFileSync(faqFile, JSON.stringify([]));

    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      if (!faqs.length) return interaction.reply({ content: '📭 No FAQs available.', ephemeral: true });
      const list = faqs.map((f, i) => `${i + 1}. **${f.question}**: ${f.answer}`).join('\n');
      return interaction.reply({ content: `📖 **FAQs:**\n${list}`, ephemeral: false });
    }

    if (subcommand === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');
      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      return interaction.reply({ content: `✅ FAQ added:\n**${question}**: ${answer}` });
    }

    if (subcommand === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });
      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      return interaction.reply({ content: `🗑️ Removed FAQ:\n**${removed.question}**: ${removed.answer}` });
    }
  }
};
