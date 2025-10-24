import fs from 'fs';
import path from 'path';

export default {
  name: 'faq-remove',
  description: 'Remove an FAQ item by its index. Example: /faq-remove index:1',
  options: [
    {
      name: 'index',
      type: 4, // INTEGER
      description: 'Index of the FAQ item to remove (starting from 1). Example: 1',
      required: true,
    },
  ],
  async execute(interaction) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ You must be an administrator to remove FAQ items.',
        ephemeral: true,
      });
    }

    const index = interaction.options.getInteger('index') - 1;
    const faqFile = path.join(process.cwd(), 'faq.json');

    if (!fs.existsSync(faqFile)) {
      return interaction.reply({
        content: '❌ FAQ file not found.',
        ephemeral: true,
      });
    }

    let faq = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (index < 0 || index >= faq.length) {
      return interaction.reply({
        content: `❌ Invalid index. Must be between 1 and ${faq.length}.`,
        ephemeral: true,
      });
    }

    const removed = faq.splice(index, 1)[0];
    fs.writeFileSync(faqFile, JSON.stringify(faq, null, 2));

    await interaction.reply({
      content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`,
      ephemeral: false,
    });
  },
};
