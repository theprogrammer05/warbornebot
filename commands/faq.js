import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists locally
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function pushToGitHub(content, message) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json`;

  // Get current file SHA
  const resGet = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!resGet.ok) throw new Error(`GitHub GET failed: ${resGet.status}`);

  const data = await resGet.json();
  const sha = data.sha;

  // PUT update
  const resPut = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    }),
  });

  if (!resPut.ok) {
    const errText = await resPut.text();
    throw new Error(`GitHub PUT failed: ${resPut.status}\n${errText}`);
  }

  return true;
}

export default {
  name: 'faq',
  description: 'Manage FAQs: list, add, or remove.',
  options: [
    {
      name: 'list',
      type: 1, // Subcommand
      description: 'List all FAQs',
    },
    {
      name: 'add',
      type: 1, // Subcommand
      description: 'Add a new FAQ',
      options: [
        { name: 'question', type: 3, description: 'FAQ question', required: true },
        { name: 'answer', type: 3, description: 'FAQ answer', required: true },
      ],
    },
    {
      name: 'remove',
      type: 1, // Subcommand
      description: 'Remove an FAQ by number',
      options: [
        { name: 'number', type: 4, description: 'FAQ number to remove', required: true },
      ],
    },
  ],

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    let faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    try {
      if (sub === 'list') {
        if (!faqs.length) return interaction.reply({ content: '❌ No FAQs found.', ephemeral: true });

        const list = faqs.map((f, i) => `**${i + 1}.** ${f.question} — ${f.answer}`).join('\n');
        return interaction.reply({ content: list, ephemeral: false });
      }

      if (sub === 'add') {
        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');

        faqs.push({ question, answer });
        const content = JSON.stringify(faqs, null, 2);
        fs.writeFileSync(faqFile, content);

        // Push to GitHub
        await pushToGitHub(content, `Add FAQ: "${question}"`);

        return interaction.reply({ content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`, ephemeral: true });
      }

      if (sub === 'remove') {
        const number = interaction.options.getInteger('number');
        if (number < 1 || number > faqs.length) return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });

        const removed = faqs.splice(number - 1, 1)[0];
        const content = JSON.stringify(faqs, null, 2);
        fs.writeFileSync(faqFile, content);

        // Push to GitHub
        await pushToGitHub(content, `Remove FAQ: "${removed.question}"`);

        return interaction.reply({ content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`, ephemeral: true });
      }
    } catch (err) {
      console.error('GitHub update failed:', err);
      return interaction.reply({ content: `⚠️ GitHub update failed: ${err.message}`, ephemeral: true });
    }
  },
};
