export default {
  name: 'flow-diagram',
  description: 'Shows how the bot works internally, including daily auto-schedule posting.',
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
→ Automatically adapts if you update schedule.json

💬 **Commands**
→ /faq → View or manage frequently asked questions
→ /schedule → View weekly schedule dynamically
→ /flow-diagram → Displays this flow

🧠 **Persistence**
→ schedule.json holds all day-specific messages
→ Can update schedule.json to change daily messages
`;

    await interaction.reply({ content: diagram, ephemeral: true });
  },
};
