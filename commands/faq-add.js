import fs from 'fs';
import path from 'path';

export default {
  name: 'faq-add',
  description: 'Add a new FAQ item. Example: /faq-add question:"How to start?" answer:"Use /start command"',
  options: [
    {
      name: 'question',
      type: 3, // STRING
      description: 'The FAQ question. Example: "How do I start?"',
      required: true,
    },
    {
      name: 'answer',
      type: 3, // STRING
      description: 'The answer for the FAQ question. Example: "Use /start command"',
      required: true,
    },
  ],
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to add FAQ items.',
        ephemeral: true,
      });
    }

    const question = interaction.options.getString('question');
    const answer = interaction.options.getString('answer');

    const faqFile = path.join(process.cwd(), 'faq.json');
    let faq = [];
    if (fs.existsSync(faqFile)) {
      faq = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    }

    faq.push({ question, answer });
    fs.writeFileSync(faqFile, JSON.stringify(faq, null, 2));

    await interaction.reply({
      content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`,
      ephemeral: false,
    });
  },
};
