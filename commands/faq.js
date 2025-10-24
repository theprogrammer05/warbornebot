import fs from 'fs';
import path from 'path';

export default {
  name: 'faq',
  description: 'Manage or view FAQ entries',
  options: [
    {
      name: 'list',
      type: 1, // SUB_COMMAND
      description: 'List all FAQ entries'
    },
    {
      name: 'add',
      type: 1, // SUB_COMMAND
      description: 'Add a new FAQ entry',
      options: [
        {
          name: 'question',
          type: 3, // STRING
          description: 'The question (max 100 chars)',
          required: true
        },
        {
          name: 'answer',
          type: 3, // STRING
          description: 'The answer (max 100 chars)',
          required: true
        }
      ]
    },
    {
      name: 'remove',
      type: 1, // SUB_COMMAND
      description: 'Remove an FAQ entry by index',
      options: [
        {
          name: 'index',
          type: 4, // INTEGER
          description: 'Index of FAQ to remove',
          required: true
        }
      ]
    }
  ],
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const faqPath = path.join(process.cwd(), 'faq.json');

    if (!fs.existsSync(faqPath)) {
      fs.writeFileSync(faqPath, JSON.stringify([]));
    }

    const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf8'));

    switch (subcommand) {
      case 'list':
        if (faqData.length === 0) return interaction.reply('❌ No FAQ entries yet.');

        const faqList = faqData
          .map((item, i) => `**${i + 1}.** ${item.question}\n> ${item.answer}`)
          .join('\n\n');

        return interaction.reply({ content: faqList, ephemeral: true });

      case 'add': {
        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');

        faqData.push({ question, answer });
        fs.writeFileSync(faqPath, JSON.stringify(faqData, null, 2));

        return interaction.reply(`✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`);
      }

      case 'remove': {
        const index = interaction.options.getInteger('index');
        if (index < 1 || index > faqData.length) return interaction.reply('❌ Invalid FAQ index.');

        const removed = faqData.splice(index - 1, 1)[0];
        fs.writeFileSync(faqPath, JSON.stringify(faqData, null, 2));

        return interaction.reply(`✅ Removed FAQ:\n**Q:** ${removed.question}`);
      }

      default:
        return interaction.reply('❌ Unknown subcommand.');
    }
  }
};
