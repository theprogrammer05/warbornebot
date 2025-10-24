import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Manage the FAQ.')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all FAQ entries')
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a new FAQ entry')
        .addStringOption(opt =>
          opt.setName('question')
            .setDescription('The FAQ question')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('answer')
            .setDescription('The FAQ answer')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove an FAQ entry by question')
        .addStringOption(opt =>
          opt.setName('question')
            .setDescription('The FAQ question to remove')
            .setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const faqFile = path.join(process.cwd(), 'faq.json');
    let faqs = fs.existsSync(faqFile) ? JSON.parse(fs.readFileSync(faqFile, 'utf8')) : [];

    if (sub === 'list') {
      if (faqs.length === 0) return interaction.reply({ content: '❌ No FAQ entries.', ephemeral: true });
      const text = faqs.map(f => `**Q:** ${f.question}\n**A:** ${f.answer}`).join('\n\n');
      return interaction.reply({ content: text, ephemeral: true });
    }

    if (sub === 'add') {
      const question = interaction.options.getString('question');
      const answer = interaction.options.getString('answer');
      faqs.push({ question, answer });
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      return interaction.reply({ content: `✅ Added FAQ: "${question}"`, ephemeral: true });
    }

    if (sub === 'remove') {
      const question = interaction.options.getString('question');
      faqs = faqs.filter(f => f.question !== question);
      fs.writeFileSync(faqFile, JSON.stringify(faqs, null, 2));
      return interaction.reply({ content: `✅ Removed FAQ: "${question}"`, ephemeral: true });
    }
  },
};
