import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., "username/repo"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_BRANCH = 'main'; // or your default branch
const GITHUB_FILE_PATH = 'faq.json';

async function updateGithubFile(content, commitMessage) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

  // Get current file SHA
  const getResp = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'WarborneBot',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!getResp.ok) {
    console.error('Failed to fetch GitHub file', await getResp.text());
    return false;
  }

  const fileData = await getResp.json();

  const putResp = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'WarborneBot',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      sha: fileData.sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!putResp.ok) {
    console.error('Failed to update GitHub file', await putResp.text());
    return false;
  }

  return true;
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
      const list = faqs.map((f, i) => `**${i + 1}.** ${f.question} — ${f.answer}`).join('\n');
      return interaction.reply({ content: list, ephemeral: false });
    }

    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');
      faqs.push({ question, answer });

      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      const success = await updateGithubFile(JSON.stringify(faqs, null, 2), `Add FAQ: ${question}`);
      if (!success) {
        return interaction.reply({ content: '❌ Failed to update GitHub.', ephemeral: true });
      }

      return interaction.reply({ content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      const success = await updateGithubFile(JSON.stringify(faqs, null, 2), `Remove FAQ: ${removed.question}`);
      if (!success) {
        return interaction.reply({ content: '❌ Failed to update GitHub.', ephemeral: true });
      }

      return interaction.reply({ content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`, ephemeral: true });
    }
  },
};
