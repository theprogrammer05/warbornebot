import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

const git = simpleGit();

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure the FAQ file exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([], null, 2));
}

export default {
  name: 'faq',
  description: 'Manage Frequently Asked Questions (list, add, remove).',
  async execute(interaction) {
    const args = interaction.options?.getString('input')?.split(' ') || [];
    const action = args[0]?.toLowerCase();

    // Load current FAQ
    const faqData = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (!action || action === 'list') {
      if (faqData.length === 0) {
        return interaction.reply({ content: '❌ No FAQ entries found.', ephemeral: true });
      }

      const list = faqData.map((entry, i) => `${i + 1}. **${entry.question}** → ${entry.answer}`).join('\n');
      return interaction.reply({ content: `📖 **FAQ List:**\n${list}`, ephemeral: false });
    }

    if (action === 'add') {
      const question = args[1];
      const answer = args.slice(2).join(' ');
      if (!question || !answer) {
        return interaction.reply({ content: '❌ Usage: /faq add <question> <answer>', ephemeral: true });
      }

      faqData.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqData, null, 2));

      // Commit to GitHub
      try {
        await git.add(faqFile);
        await git.commit(`Add FAQ: ${question}`);
        await git.push();
      } catch (err) {
        console.error('❌ GitHub commit failed:', err);
      }

      return interaction.reply({ content: `✅ Added FAQ: **${question}**`, ephemeral: true });
    }

    if (action === 'remove') {
      const index = parseInt(args[1]);
      if (!index || index < 1 || index > faqData.length) {
        return interaction.reply({ content: '❌ Usage: /faq remove <number>', ephemeral: true });
      }

      const removed = faqData.splice(index - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqData, null, 2));

      // Commit to GitHub
      try {
        await git.add(faqFile);
        await git.commit(`Remove FAQ: ${removed.question}`);
        await git.push();
      } catch (err) {
        console.error('❌ GitHub commit failed:', err);
      }

      return interaction.reply({ content: `✅ Removed FAQ: **${removed.question}**`, ephemeral: true });
    }

    return interaction.reply({ content: '❌ Unknown action. Use list, add, or remove.', ephemeral: true });
  },
};
