import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import Discord from 'discord.js';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = Discord;

const faqFile = path.join(process.cwd(), 'faq.json');

// Ensure faq.json exists locally
if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

// GitHub info from environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // format: "username/repo"
const GITHUB_USER = process.env.GITHUB_USER;
const BRANCH = process.env.BRANCH || 'main';

// Quick Railway env debug (temporary)
console.log('Railway env vars:');
console.log('GITHUB_REPO:', process.env.GITHUB_REPO);
console.log('GITHUB_TOKEN set?', !!process.env.GITHUB_TOKEN);
console.log('GITHUB_USER:', process.env.GITHUB_USER);

/**
 * Update GitHub file with FAQs (creates if missing)
 * Includes detailed debug logs
 */
async function updateGitHub(faqs) {
  if (!GITHUB_REPO || !GITHUB_TOKEN || !GITHUB_USER) {
    console.error('❌ Missing one of GITHUB_REPO, GITHUB_TOKEN, or GITHUB_USER');
    return;
  }

  let sha;

  try {
    const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json?ref=${BRANCH}`;
    console.log('GET URL:', getUrl);

    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': GITHUB_USER,
      },
    });

    console.log('GET status:', getRes.status);

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      console.log('Existing file SHA:', sha);
    } else if (getRes.status === 404) {
      console.log('File does not exist in repo, will create new file.');
    } else {
      const errText = await getRes.text();
      console.error('GitHub GET failed:', getRes.status, errText);
      return;
    }
  } catch (err) {
    console.error('GitHub GET request failed:', err);
    return;
  }

  try {
    const putUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/faq.json`;
    console.log('PUT URL:', putUrl);

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': GITHUB_USER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update FAQ via Discord bot',
        content: Buffer.from(JSON.stringify(faqs, null, 2)).toString('base64'),
        sha, // undefined if creating new file
        branch: BRANCH,
      }),
    });

    console.log('PUT status:', putRes.status);

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error('GitHub PUT failed:', errText);
    } else {
      console.log('✅ FAQ pushed to GitHub successfully.');
    }
  } catch (err) {
    console.error('GitHub PUT request failed:', err);
  }
}

// Helper to paginate FAQs
function paginate(array, pageSize, pageNumber) {
  return array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
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
    const sub = interaction.options.getSubcommand(false);
    if (!sub) {
      return interaction.reply({
        content: '❌ You must specify a subcommand: list, add, or remove.',
        ephemeral: true,
      });
    }

    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    // ---------- LIST ----------
    if (sub === 'list') {
      if (!faqs.length) return interaction.reply({ content: '❌ No FAQs found.', ephemeral: true });

      const pageSize = 5;
      let page = 0;

      const getContent = (page) =>
        paginate(faqs, pageSize, page)
          .map((faq, i) => `**${i + 1 + page * pageSize}.** ${faq.question} — ${faq.answer}`)
          .join('\n');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId('next').setLabel('Next ➡️').setStyle(ButtonStyle.Primary).setDisabled(faqs.length <= pageSize)
      );

      const reply = await interaction.reply({
        content: getContent(page),
        components: [row],
        ephemeral: false,
        fetchReply: true,
      });

      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

      collector.on('collect', (btn) => {
        if (btn.user.id !== interaction.user.id) return btn.reply({ content: '❌ Not for you', ephemeral: true });

        if (btn.customId === 'next') page++;
        if (btn.customId === 'prev') page--;

        row.components[0].setDisabled(page === 0);
        row.components[1].setDisabled((page + 1) * pageSize >= faqs.length);

        btn.update({ content: getContent(page), components: [row] });
      });

      collector.on('end', () => {
        row.components.forEach((btn) => btn.setDisabled(true));
        interaction.editReply({ components: [row] }).catch(() => {});
      });

      return;
    }

    // ---------- ADD ----------
    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');

      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      await updateGitHub(faqs);

      return interaction.reply({
        content: `✅ FAQ added:\n**Q:** ${question}\n**A:** ${answer}`,
        ephemeral: true,
      });
    }

    // ---------- REMOVE ----------
    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length) return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });

      const removed = faqs.splice(number - 1, 1)[0];
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      await updateGitHub(faqs);

      return interaction.reply({
        content: `✅ Removed FAQ:\n**Q:** ${removed.question}\n**A:** ${removed.answer}`,
        ephemeral: true,
      });
    }
  },
};
