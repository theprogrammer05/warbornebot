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
  name: 'wb-research',
  description: 'View research information (drifter, driftmark, or equip)',
  options: [
    {
      name: 'type',
      type: 3, // STRING
      description: 'Select a research type to view',
      required: true,
      choices: [
        { name: 'Drifter Research', value: 'drifter' },
        { name: 'Driftmark Research', value: 'driftmark' },
        { name: 'Equipment Research', value: 'equip' },
        { name: 'View All Diagrams', value: 'all' }
      ]
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

    // Handle 'all' option
    if (researchType === 'all') {
      const embed = new EmbedBuilder()
        .setTitle('🔬 All Research Diagrams')
        .setColor('#0099ff');

      // Add image for each research type
      const imageUrls = {
        drifter: 'https://i.imgur.com/your-drifter-image.png',
        driftmark: 'https://i.imgur.com/your-driftmark-image.png',
        equip: 'https://i.imgur.com/your-equip-image.png'
      };

      for (const [type, url] of Object.entries(imageUrls)) {
        const research = researchData[type];
        if (research) {
          embed.addFields({
            name: `🔹 ${research.name}`,
            value: `[View Diagram](${url})`,
            inline: true
          });
        }
      }

      // Add a note about the images
      embed.setFooter({ text: 'Click the links above to view each research diagram' });
      return interaction.reply({ embeds: [embed] });
    }

    // Show specific category details
    const research = researchData[researchType];
    if (!research) {
      return interaction.reply({
        content: '❌ Invalid research type. Available types: drifter, driftmark, equip, all',
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
  }
};
