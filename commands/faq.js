import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

// Initialize simple-git with the repo path
const git = simpleGit(process.cwd());

async function commitFaqChanges(message) {
  try {
    await git.add('faq.json');
    await git.commit(message);
    await git.push('origin', 'main'); // Change 'main' to your default branch if different
  } catch (err) {
    console.error('Git commit/push failed:', err);
  }
}

export default {
  name: 'faq',
  description: 'Manage FAQs: list, add, or remove.',
  options: [
    {
      name: 'list',
      type: 1, // Subcommand
      description: 'List all FAQs'
    },
    {
      name: 'add',
      type: 1, // Subcommand
      description: 'Add a new FAQ',
      options: [
        {
          name: 'question',
          type: 3, // STRING
          description: 'The FAQ question',
          required: true
        },
        {
          name: 'answer',
          type: 3, // STRING
          description: 'The FAQ answer',
          required: true
        }
      ]
    },
    {
      name: 'remove',
      type: 1, // Subcommand
      description: 'Remove an FAQ by number',
      options: [
        {
          name: 'number',
          type: 4, // INTEGER
          description: 'The number of the FAQ to remove',
          required: true
        }
      ]
    }
  ],

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (sub === 'list') {
      if (!faqs.length) {
        return interaction.reply({ content: '❌ No FAQs found.', ephemeral: true });
      }
      const list = faqs.map((faq, i) => `**${i + 1}.** ${faq.question} — ${faq.answer}`).join('\n');
      return interaction.reply({ content: list, ephemeral: false });
    }

    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');

      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      await commitFaqChanges(`Add FAQ: "${question}"`);

      return interaction.reply({ content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) {
        return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });
      }

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      await commitFaqChanges(`Remove FAQ: "${removed.question}"`);

      return interaction.reply({ content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`, ephemeral: true });
    }
  }
};
