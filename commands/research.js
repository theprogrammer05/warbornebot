import fs from 'fs';
import path from 'path';
import { EmbedBuilder, MessageFlags } from 'discord.js';

const researchFile = path.join(process.cwd(), 'research.json');

function loadResearchData() {
  try {
    return JSON.parse(fs.readFileSync(researchFile, 'utf8'));
  } catch (error) {
    console.error('Error loading research data:', error);
    return null;
  }
}

function formatNumber(num) {
  return num.toLocaleString();
}

export default {
  name: 'wb-research',
  description: 'View research information and upgrade costs',
  options: [
    {
      name: 'type',
      type: 3, // STRING
      description: 'Select a research type to view',
      required: true,
      choices: [
        { name: 'Drifter Tiers', value: 'drifter' },
        { name: 'Driftmark Tiers', value: 'driftmark' },
        { name: 'Equipment Tiers', value: 'equip' },
        { name: 'Drifter Stats (Str/Agi/Int/Melee/Ranged)', value: 'drifter_stats' },
        { name: 'Armor & Weapon Boosts', value: 'armor_weapon_boosts' }
      ]
    }
  ],
  
  async execute(interaction) {
    const researchData = loadResearchData();
    if (!researchData) {
      return interaction.reply({
        content: '❌ Failed to load research data.',
        flags: MessageFlags.Ephemeral
      });
    }

    const researchType = interaction.options.getString('type')?.toLowerCase();
    const research = researchData[researchType];
    
    if (!research) {
      return interaction.reply({
        content: '❌ Invalid research type.',
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔬 ${research.name}`)
      .setDescription(research.description)
      .setColor('#7289da');

    // Add note if it exists
    if (research.note) {
      embed.addFields({ 
        name: '⚠️ Note', 
        value: research.note,
        inline: false 
      });
    }

    // Handle tier-based research (drifter, driftmark, equip)
    if (research.tiers && research.tiers.length > 0) {
      if (researchType === 'driftmark') {
        // Driftmark special formatting
        let table = '```\n';
        table += 'Tier  | Exergy   | Starfall  | Duration\n';
        table += '------|----------|-----------|----------\n';
        
        research.tiers.forEach(tier => {
          table += `${tier.tier.padEnd(6)}| ${formatNumber(tier.exergy).padEnd(9)}| ${formatNumber(tier.starfall).padEnd(10)}| ${tier.duration}\n`;
        });
        table += '```';
        embed.addFields({ name: '📈 Tier Requirements', value: table });
      } else {
        // Drifter/Equipment tier formatting
        let table = '```\n';
        table += 'Tier  | Exergy\n';
        table += '------|---------\n';
        
        research.tiers.forEach(tier => {
          table += `${tier.tier.padEnd(6)}| ${formatNumber(tier.exergy)}\n`;
        });
        table += '```';
        embed.addFields({ name: '📈 Tier Requirements', value: table });
      }
    }

    // Handle item-based research with level costs (drifter_stats, armor_weapon_boosts)
    if (research.items && research.items.length > 0) {
      // Show metadata
      if (research.baseCost && research.multiplier) {
        embed.addFields({
          name: '📊 Upgrade Info',
          value: 
            `⚡ Resource: **${research.resource}**\n` +
            `🔢 Base Cost: **${formatNumber(research.baseCost)}**\n` +
            `📈 Multiplier: **${research.multiplier}x**\n` +
            `🎯 Max Level: **${research.maxLevel}**`,
          inline: false
        });
      }

      // For each item, show a compact cost table with cumulative
      research.items.slice(0, 1).forEach(item => {
        let costTable = '```\n';
        costTable += 'Lvl | Cost      | Total Cost\n';
        costTable += '----|-----------|------------\n';
        
        let cumulative = 0;
        item.costs.forEach((cost, index) => {
          cumulative += cost;
          const level = (index + 1).toString().padStart(3);
          const costStr = formatNumber(cost).padStart(9);
          const totalStr = formatNumber(cumulative).padStart(10);
          costTable += `${level} | ${costStr} | ${totalStr}\n`;
        });
        
        costTable += '```';
        embed.addFields({ 
          name: `💎 ${item.name} (Sample - All items have same costs)`, 
          value: costTable 
        });
      });

      // Show summary
      const totalToMax = research.items[0].costs.reduce((a, b) => a + b, 0);
      embed.addFields({
        name: '💰 Cost Summary',
        value: 
          `**Total to max one item:** ${formatNumber(totalToMax)} ${research.resource}\n` +
          `**Total for all ${research.items.length} items:** ${formatNumber(totalToMax * research.items.length)} ${research.resource}`,
        inline: false
      });
    }

    embed.setFooter({ text: '💡 Plan your research upgrades wisely!' });

    return interaction.reply({ 
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};
