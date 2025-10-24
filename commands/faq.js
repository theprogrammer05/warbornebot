import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

const faqFile = path.join(process.cwd(), 'faq.json');

if (!fs.existsSync(faqFile)) {
  fs.writeFileSync(faqFile, JSON.stringify([]));
}

// GitHub info
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const BRANCH = process.env.BRANCH || 'main';

async function updateGitHub(faqs) {
  try {
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
    const fileData = await getRes.json();

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
          message: 'Update FAQ via Discord bot',
          content: Buffer.from(JSON.stringify(faqs, null, 2)).toString('base64'),
          sha: fileData.sha,
          branch: BRANCH,
        }),
      }
    );

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error('GitHub PUT failed:', errText);
    } else {
      console.log('✅ FAQ pushed to GitHub successfully.');
    }
  } catch (err) {
    console.error('GitHub update failed:', err);
  }
}

// Helper for paginating FAQs
function paginate(array, page_size, page_number) {
  return array.slice(page_number * page_size, (page_number + 1) * page_size);
}

export default {
  name: 'faq',
  description: 'Manage FAQs: list, add, or remove.',
  options: [
    {
      name: 'list',
      type: 1,
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
    let sub;
    try {
      sub = interaction.options.getSubcommand();
    } catch (err) {
      return interaction.reply({
        content: '❌ You must specify a subcommand: list, add, or remove.',
        ephemeral: true,
      });
    }

    const faqs = JSON.parse(fs.readFileSync(faqFile, 'utf8'));

    if (sub === 'list') {
      if (!faqs.length)
        return interaction.reply({ content: '❌ No FAQs found.', ephemeral: true });

      const pageSize = 5;
      let page = 0;

      const getContent = (page) =>
        paginate(faqs, pageSize, page)
          .map((faq, i) => `**${i + 1 + page * pageSize}.** ${faq.question} — ${faq.answer}`)
          .join('\n');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('⬅️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(faqs.length <= pageSize)
      );

      const reply = await interaction.reply({
        content: getContent(page),
        components: [row],
        ephemeral: false,
        fetchReply: true,
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

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

    if (sub === 'remove') {
      const number = interaction.options.getInteger('number');
      if (number < 1 || number > faqs.length)
        return interaction.reply({ content: '❌ Invalid FAQ number.', ephemeral: true });

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
