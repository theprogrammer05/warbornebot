import { SlashCommandBuilder } from "discord.js";
import fs from "fs";

const FAQ_FILE = "./faq_data.json"; // persisted FAQ data

function loadFaq() {
  try {
    return JSON.parse(fs.readFileSync(FAQ_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveFaq(data) {
  fs.writeFileSync(FAQ_FILE, JSON.stringify(data, null, 2));
}

export default {
  data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Manage or view frequently asked questions.")
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all FAQs.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new FAQ entry.")
        .addStringOption((opt) =>
          opt.setName("question").setDescription("The FAQ question").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("answer").setDescription("The FAQ answer").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an FAQ entry by question.")
        .addStringOption((opt) =>
          opt.setName("question").setDescription("The exact question to remove").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const faqs = loadFaq();
      if (faqs.length === 0)
        return interaction.reply({ content: "No FAQs found.", ephemeral: true });

      const formatted = faqs
        .map((f, i) => `**${i + 1}. ${f.question}**\n${f.answer}`)
        .join("\n\n");

      return interaction.reply({ content: formatted, ephemeral: true });
    }

    if (sub === "add") {
      const question = interaction.options.getString("question");
      const answer = interaction.options.getString("answer");
      const faqs = loadFaq();

      faqs.push({ question, answer });
      saveFaq(faqs);

      return interaction.reply({
        content: `✅ Added new FAQ:\n**${question}**\n${answer}`,
        ephemeral: true,
      });
    }

    if (sub === "remove") {
      const question = interaction.options.getString("question");
      let faqs = loadFaq();
      const before = faqs.length;

      faqs = faqs.filter((f) => f.question !== question);
      if (faqs.length === before)
        return interaction.reply({
          content: "⚠️ No FAQ found with that exact question.",
          ephemeral: true,
        });

      saveFaq(faqs);
      return interaction.reply({
        content: `🗑️ Removed FAQ: **${question}**`,
        ephemeral: true,
      });
    }
  },
};
