import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("flow-diagram")
    .setDescription("Shows how the bot works internally, including daily auto-schedule posting."),
  async execute(interaction) {
    const diagram = `
**WarborneBot Flow Diagram**

🌀 **Startup**
→ Loads environment variables (.env)
→ Registers slash commands (/faq, /schedule, /flow-diagram)
→ Reads schedule.json
→ Logs in as bot user

📅 **Daily Schedule Logic**
→ Reads current weekday (e.g., "Tuesday")
→ Finds matching event from schedule.json
→ Posts automatic message to #announcements (set by ANNOUNCE_CHANNEL_ID)
→ Reschedules itself to run again at the next midnight

💬 **Commands**
→ /faq → View or manage frequently asked questions
→ /schedule → View weekly schedule dynamically
→ /flow-diagram → Displays this flow

🧠 **Persistence**
→ schedule.json holds all day-specific messages
→ Automatically adapts if you update schedule.json
`;

    await interaction.reply({ content: diagram, ephemeral: true });
  },
};
