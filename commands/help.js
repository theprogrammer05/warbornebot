export default {
  name: 'help',
  description: 'Displays all available bot commands with example usage and links to the flow diagram.',
  async execute(interaction) {
    const helpMessage = `
📌 **Bot Commands Overview**

**1️⃣ Schedule Commands**
• /season-event date:YYYY-MM-DD → View the schedule for a specific date.
• /season-event date:YYYY-MM-DD add_event:"Event Name" → Add or update an event.

**2️⃣ FAQ Commands**
• /faq → Display all FAQ items.
• /faq-add question:"..." answer:"..." → Add a new FAQ item.
• /faq-remove index:N → Remove an FAQ item by its number (see /faq).
• /faq-search keyword:"..." → Search FAQ items by keyword.

**3️⃣ Price & Tier Commands**
• /price numbers:"equipCost starfallChestCost solarbiteCost" → Calculate Solarbite break-even.
• /driftmark → Show Driftmark tiers and values.
• /drifter → Show Drifter tiers and values.
• /equip → Show equipment tiers and values.

**4️⃣ Cron Job Management**
• /list-cron → List all active cron jobs.
• /clear-cron → Stop all cron jobs.

**5️⃣ Bot Architecture**
• /flow-diagram → View a detailed diagram of the bot’s structure, data flow, and environment variables.

💡 **Tips**
• Admin-only commands: /faq-add, /faq-remove, /season-event (with add_event)
• JSON files store all dynamic data: schedule.json and faq.json
• Example usage is provided in each command’s description for easy reference.
`;

    await interaction.reply({ content: helpMessage, ephemeral: false });
  },
};
