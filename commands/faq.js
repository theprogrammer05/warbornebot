import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = 'main'; // adjust if your branch is different

async function updateGithubFile(faqs) {
  try {
    // Get the current file to retrieve SHA
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/faq.json?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    let sha;
    if (getResponse.status === 200) {
      const data = await getResponse.json();
      sha = data.sha;
    }

    // Update the file
    const putResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/faq.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: 'Update FAQ via bot',
          content: Buffer.from(JSON.stringify(faqs, null, 2)).toString('base64'),
          sha: sha,
          branch: BRANCH,
        }),
      }
    );

    const result = await putResponse.json();
    if (!putResponse.ok) {
      console.error('GitHub PUT failed:', result);
    } else {
      console.log('GitHub FAQ update successful.');
    }
  } catch (err) {
    console.error('GitHub update failed:', err);
  }
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
        {
          name: 'question',
          type: 3, // STRING
          description: 'The FAQ question',
          required: true,
        },
        {
          name: 'answer',
          type: 3, // STRING
          description: 'The FAQ answer',
          required: true,
        },
      ],
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
          required: true,
        },
      ],
    },
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

      // Update GitHub
      await updateGithubFile(faqs);

      return interaction.reply({ content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) {
        return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });
      }

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      // Update GitHub
      await updateGithubFile(faqs);

      return interaction.reply({ content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`, ephemeral: true });
    }
  },
};
