import fs from "fs";
import path from "path";
import { SlashCommandBuilder } from "discord.js";
import { execSync } from "child_process";

const filePath = path.join(process.cwd(), "faq.json");

// --- Git commit helper ---
async function commitToGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const user = process.env.GITHUB_USER;

  if (!token || !repo || !user) {
    console.log("❌ Missing GitHub environment variables. Skipping auto-commit.");
    return;
  }

  try {
    execSync(`git config --global user.email "${user}@users.noreply.github.com"`);
    execSync(`git config --global user.name "${user}"`);

    execSync(`git add faq.json`);
    execSync(`git commit -m "🤖 Auto-update FAQ file" || echo "No changes to commit"`);
    execSync(`git push https://${user}:${token}@github.com/${repo}.git HEAD:main`);
    console.log("✅ FAQ changes pushed to GitHub.");
  } catch (err) {
    console.error("❌ Failed to push FAQ changes to GitHub:", err.message);
  }
}

// --- Slash command setup ---
export default {
  data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Manage or view FAQ entries.")
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Show all FAQ entries.")
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
          opt.setName("question").setDescription("Exact question to remove").setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Load existing FAQs or create a new file
    let faqs = {};
    if (fs.existsSync(filePath)) {
      faqs = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    // Handle each subcommand
    if (subcommand === "list") {
      if (Object.keys(faqs).length === 0) {
        return interaction.reply({
          content: "📭 No FAQ entries found.",
          ephemeral: true,
        });
      }

      const list = Object.entries(faqs)
        .map(([q, a]) => `**Q:** ${q}\n**A:** ${a}`)
        .join("\n\n");

      return interaction.reply({ content: list, ephemeral: false });
    }

    if (subcommand === "add") {
      const question = interaction.options.getString("question");
      const answer = interaction.options.getString("answer");

      faqs[question] = answer;
      fs.writeFileSync(filePath, JSON.stringify(faqs, null, 2));

      await interaction.reply({
        content: `✅ Added FAQ:\n**Q:** ${question}\n**A:** ${answer}`,
        ephemeral: false,
      });

      await commitToGitHub();
      return;
    }

    if (subcommand === "remove") {
      const question = interaction.options.getString("question");

      if (!faqs[question]) {
        return interaction.reply({
          content: `❌ No FAQ found with question: "${question}"`,
          ephemeral: true,
        });
      }

      delete faqs[question];
      fs.writeFileSync(filePath, JSON.stringify(faqs, null, 2));

      await interaction.reply({
        content: `🗑️ Removed FAQ with question: "${question}"`,
        ephemeral: false,
      });

      await commitToGitHub();
      return;
    }
  },
};
