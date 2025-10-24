import fs from "fs";
import path from "path";

export default {
  name: "schedule",
  description: "Displays the current weekly schedule (and highlights today's event).",
  async execute(interaction) {
    const scheduleFile = path.join(process.cwd(), "schedule.json");

    if (!fs.existsSync(scheduleFile)) {
      return interaction.reply({
        content: "❌ Schedule file not found.",
        ephemeral: true,
      });
    }

    const schedule = JSON.parse(fs.readFileSync(scheduleFile, "utf8"));
    const today = new Date().toLocaleString("en-US", { weekday: "long", timeZone: "America/Chicago" }); // CST
    const todayEvent = schedule[today] || "No special events today.";

    const formattedSchedule = Object.entries(schedule)
      .map(([day, event]) => `${day}: ${event}`)
      .join("\n");

    await interaction.reply({
      content: `📅 **Weekly Schedule**\n\n⭐ **Today (${today}):** ${todayEvent}\n\n${formattedSchedule}`,
      ephemeral: false, // visible to everyone
    });
  },
};
