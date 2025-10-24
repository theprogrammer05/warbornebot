import fs from 'fs';
import path from 'path';

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

// GitHub integration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., "username/repo"
const GITHUB_USER = process.env.GITHUB_USER; // e.g., "username"

async function updateGithubFile() {
  const content = fs.readFileSync(faqFile, 'utf8');
  const base64Content = Buffer.from(content).toString('base64');

  // Get the current SHA of the file
  const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json`;

  const getRes = await fetch(getUrl, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': GITHUB_USER,
    },
  });

  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  } else if (getRes.status === 404) {
    sha = undefined; // file doesn't exist yet
  } else {
    console.error('GitHub GET failed:', await getRes.text());
    return;
  }

  // PUT request to create/update the file
  const putRes = await fetch(getUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': GITHUB_USER,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update FAQs via bot',
      content: base64Content,
      sha,
      branch: 'main', // adjust if using a different branch
    }),
  });

  if (!putRes.ok) {
    console.error('GitHub PUT failed:', await putRes.text());
  } else {
    console.log('GitHub FAQ update successful!');
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
      type: 1,
      description: 'Add a new FAQ',
      options: [
        {
          name: 'question',
          type: 3,
          description: 'The FAQ question',
          required: true,
        },
        {
          name: 'answer',
          type: 3,
          description: 'The FAQ answer',
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      type: 1,
      description: 'Remove an FAQ by number',
      options: [
        {
          name: 'number',
          type: 4,
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
      const list = faqs
        .map((faq, i) => `**${i + 1}.** ${faq.question} — ${faq.answer}`)
        .join('\n');
      return interaction.reply({ content: list, ephemeral: false });
    }

    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');
      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      await updateGithubFile().catch(console.error);

      return interaction.reply({
        content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`,
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) {
        return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });
      }

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));

      await updateGithubFile().catch(console.error);

      return interaction.reply({
        content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`,
        ephemeral: true,
      });
    }
  },
};
