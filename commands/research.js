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
      let cumulativeExergy = 0;
      let cumulativeStarfall = 0;
      let hasAnyExergy = false;
      let hasAnyStarfall = false;
      
      // Check what data we have
      research.tiers.forEach(tier => {
        if (tier.exergy) hasAnyExergy = true;
        if (tier.starfall !== null) hasAnyStarfall = true;
      });
      
      // Exergy table
      if (hasAnyExergy) {
        let exergyTable = '```\n';
        exergyTable += 'Tier | Cost      | Total Cost\n';
        exergyTable += '-----|-----------|------------\n';
        
        cumulativeExergy = 0;
        research.tiers.forEach(tier => {
          if (tier.exergy) cumulativeExergy += tier.exergy;
          const tierStr = tier.tier.padEnd(4);
          const costStr = (tier.exergy ? formatNumber(tier.exergy) : '?').padStart(9);
          const totalStr = (tier.exergy ? formatNumber(cumulativeExergy) : '?').padStart(10);
          exergyTable += ` ${tierStr}| ${costStr} | ${totalStr}\n`;
        });
        
        exergyTable += '```';
        embed.addFields({ name: ':diamonds: Exergy Requirements', value: exergyTable });
      }
      
      // Starfall table
      if (hasAnyStarfall) {
        let starfallTable = '```\n';
        starfallTable += 'Tier | Cost         | Total Cost\n';
        starfallTable += '-----|--------------|-------------\n';
        
        cumulativeStarfall = 0;
        research.tiers.forEach(tier => {
          if (tier.starfall !== null) cumulativeStarfall += tier.starfall;
          const tierStr = tier.tier.padEnd(4);
          const costStr = (tier.starfall !== null ? formatNumber(tier.starfall) : '?').padStart(12);
          const totalStr = (tier.starfall !== null ? formatNumber(cumulativeStarfall) : '?').padStart(11);
          starfallTable += ` ${tierStr}| ${costStr} | ${totalStr}\n`;
        });
        
        starfallTable += '```';
        embed.addFields({ name: ':moneybag: Starfall Requirements', value: starfallTable });
      } else {
        // Show placeholder for starfall
        embed.addFields({ name: ':moneybag: Starfall Requirements', value: '```\nData coming soon...\n```' });
      }
    }

    // Handle item-based research with level costs (drifter_stats, armor_weapon_boosts)
    if (research.items && research.items.length > 0) {
      // Show metadata
      if (research.baseExergyCost || research.baseStarfallCost) {
        let upgradeInfo = '';
        
        if (research.baseExergyCost && research.exergyMultiplier) {
          upgradeInfo += `:diamonds: **Exergy**\n`;
          upgradeInfo += `Base Cost: **${formatNumber(research.baseExergyCost)}** • Multiplier: **${research.exergyMultiplier}x**\n`;
        }
        
        if (research.baseStarfallCost !== undefined) {
          if (upgradeInfo) upgradeInfo += `\n`;
          upgradeInfo += `:moneybag: **Starfall**\n`;
          if (research.baseStarfallCost && research.starfallMultiplier) {
            upgradeInfo += `Base Cost: **${formatNumber(research.baseStarfallCost)}** • Multiplier: **${research.starfallMultiplier}x**\n`;
          } else {
            upgradeInfo += `Base Cost: **Unknown** • Multiplier: **TBD**\n`;
          }
        }
        
        if (upgradeInfo) {
          embed.addFields({
            name: '📊 Progression',
            value: upgradeInfo,
            inline: false
          });
        }
      }

      // Split into two tables for better readability
      const sampleItem = research.items[0];
      const hasExergy = sampleItem.exergyCosts && sampleItem.exergyCosts.length > 0;
      const hasStarfall = sampleItem.starfallCosts && sampleItem.starfallCosts.length > 0;
      
      let cumulativeExergy = 0;
      let cumulativeStarfall = 0;
      
      // Exergy table
      if (hasExergy) {
        let exergyTable = '```\n';
        exergyTable += 'Lvl | Cost      | Total Cost\n';
        exergyTable += '----|-----------|------------\n';
        
        sampleItem.exergyCosts.forEach((cost, i) => {
          cumulativeExergy += cost;
          const lvl = (i + 1).toString().padStart(2);
          exergyTable += ` ${lvl} | ${formatNumber(cost).padStart(9)} | ${formatNumber(cumulativeExergy).padStart(10)}\n`;
        });
        
        exergyTable += '```';
        embed.addFields({ name: ':diamonds: Exergy Costs', value: exergyTable });
      }
      
      // Starfall table
      if (hasStarfall) {
        let starfallTable = '```\n';
        starfallTable += 'Lvl | Cost      | Total Cost\n';
        starfallTable += '----|-----------|------------\n';
        
        sampleItem.starfallCosts.forEach((cost, i) => {
          cumulativeStarfall += cost;
          const lvl = (i + 1).toString().padStart(2);
          starfallTable += ` ${lvl} | ${formatNumber(cost).padStart(9)} | ${formatNumber(cumulativeStarfall).padStart(10)}\n`;
        });
        
        starfallTable += '```';
        embed.addFields({ name: ':moneybag: Starfall Costs', value: starfallTable });
      } else if (research.baseStarfallCost !== undefined) {
        // Show placeholder if starfall field exists but no data yet
        embed.addFields({ name: ':moneybag: Starfall Costs', value: '```\nData coming soon...\n```' });
      }

      // Show summary
      const totalExergyToMax = hasExergy ? cumulativeExergy : null;
      const totalStarfallToMax = hasStarfall ? cumulativeStarfall : null;
      
      let summaryText = '';
      if (totalExergyToMax !== null) {
        summaryText += `:diamonds: **One item:** ${formatNumber(totalExergyToMax)} Exergy\n`;
        summaryText += `:diamonds: **All ${research.items.length} items:** ${formatNumber(totalExergyToMax * research.items.length)} Exergy\n`;
      }
      if (totalStarfallToMax !== null) {
        if (summaryText) summaryText += '\n';
        summaryText += `:moneybag: **One item:** ${formatNumber(totalStarfallToMax)} Starfall\n`;
        summaryText += `:moneybag: **All ${research.items.length} items:** ${formatNumber(totalStarfallToMax * research.items.length)} Starfall`;
      }
      
      if (summaryText) {
        embed.addFields({
          name: '📊 Total to Max All Levels',
          value: summaryText,
          inline: false
        });
      }
    }

    embed.setFooter({ text: '💡 Plan wisely • 🔬 Research smarter, not harder' });

    return interaction.reply({ 
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};
