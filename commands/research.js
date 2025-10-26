import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from 'discord.js';

const researchFile = path.join(process.cwd(), 'research.json');

// Load research data
function loadResearchData() {
  try {
    const data = fs.readFileSync(researchFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading research data:', error);
    return null;
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default {
  name: 'research',
  description: 'View research information (drifter, driftmark, or equip)',
  options: [
    {
      name: 'type',
      type: 3, // STRING
      description: 'Research type (drifter, driftmark, or equip)',
      required: false
    }
  ],
  
  async execute(interaction) {
    const researchData = loadResearchData();
    if (!researchData) {
      return interaction.reply({
        content: '❌ Failed to load research data.',
        ephemeral: true
      });
    }

    const researchType = interaction.options.getString('type')?.toLowerCase();

    if (researchType) {
      // Show specific category details
      const research = researchData[researchType];
      if (!research) {
        return interaction.reply({
          content: '❌ Invalid research type. Available types: drifter, driftmark, equip',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔍 ${research.name} Research`)
        .setDescription(research.description)
        .setColor('#0099ff');

      // Format the tiers based on the research type
      if (researchType === 'driftmark') {
        // For Driftmark, show a table with all properties
        let table = '```\n';
        table += 'Tier  | Exergy   | Starfall  | Duration\n';
        table += '------|----------|-----------|----------\n';
        
        research.tiers.forEach(tier => {
          table += `${tier.tier.padEnd(6)}| ${formatNumber(tier.exergy).padEnd(9)}| ${formatNumber(tier.starfall).padEnd(10)}| ${tier.duration}\n`;
        });
        
        table += '```';
        embed.addFields({ name: 'Tier Values', value: table });
      } else {
        // For Drifter and Equipment, show a simpler table with just tier and exergy
        let table = '```\n';
        table += 'Tier  | Exergy\n';
        table += '------|---------\n';
        
        research.tiers.forEach(tier => {
          table += `${tier.tier.padEnd(6)}| ${formatNumber(tier.exergy)}\n`;
        });
        
        table += '```';
        embed.addFields({ name: 'Tier Values', value: table });
      }

      return interaction.reply({ embeds: [embed] });
    } else {
      // Show all categories
      const embed = new EmbedBuilder()
        .setTitle('🔬 Research Categories')
        .setDescription('Use `/research category:<name>` to view details')
        .setColor('#0099ff');

      // Add a field for each category
      Object.entries(researchData).forEach(([key, data]) => {
        const tierRange = data.tiers.length > 0 
          ? `Tiers: ${data.tiers[0].tier}-${data.tiers[data.tiers.length - 1].tier}`
          : 'No tier data';
          
        embed.addFields({
          name: `🔹 ${data.name}`,
          value: `${data.description}\n${tierRange}`,
          inline: true
        });
      });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
