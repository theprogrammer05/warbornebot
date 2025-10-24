import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists locally
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., theprogrammer05/warbornebot
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // your personal access token
const GITHUB_USER = process.env.GITHUB_USER; // e.g., theprogrammer05
const BRANCH = 'main';

async function githubUpdate(contentObj, message) {
  try {
    // 1️⃣ Get current file SHA
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': GITHUB_USER,
        },
      }
    );

    if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`);
    const data = await getRes.json();
    const sha = data.sha;

    // 2️⃣ Update via PUT
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': GITHUB_USER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64'),
          sha,
          branch: BRANCH,
        }),
      }
    );

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`GitHub PUT failed: ${errText}`);
    }
    console.log('GitHub update successful');
  } catch (err) {
    console.error('GitHub update failed:', err.message);
  }
}

export default {
  name: 'faq',
  description: 'Manage FAQs: list, add, or remove.',
  options: [
    { name: 'list', type: 1, description: 'List all FAQs' },
    {
      name: 'add',
      type: 1,
      description: 'Add a new FAQ',
      options: [
        { name: 'question', type: 3, description: 'The FAQ question', required: true },
        { name: 'answer', type: 3, description: 'The FAQ answer', required: true },
      ],
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an FAQ by number',
      options: [
        { name: 'number', type: 4, description: 'The number of the FAQ to remove', required: true },
      ],
    },
  ],

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (sub === 'list') {
      if (!faqs.length) return interaction.reply({ content: '❌ No FAQs found.', ephemeral: true });
      const list = faqs.map((faq, i) => `**${i + 1}.** ${faq.question} — ${faq.answer}`).join('\n');
      return interaction.reply({ content: list, ephemeral: false });
    }

    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');

      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      // Push to GitHub
      await githubUpdate(faqs, `Add FAQ: ${question}`);

      return interaction.reply({ content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length)
        return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      // Push to GitHub
      await githubUpdate(faqs, `Remove FAQ: ${removed.question}`);

      return interaction.reply({
        content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`,
        ephemeral: true,
      });
    }
  },
};
