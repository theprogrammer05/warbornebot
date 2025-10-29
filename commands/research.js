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
      let table = '```\n';
      table += 'Tier | :diamonds: Exergy | Total :diamonds: | :moneybag: Starfall | Total :moneybag:\n';
      table += '-----|-------------------|------------------|---------------------|------------------\n';
      
      let cumulativeExergy = 0;
      let cumulativeStarfall = 0;
      let hasAnyExergy = false;
      let hasAnyStarfall = false;
      
      research.tiers.forEach(tier => {
        if (tier.exergy) {
          cumulativeExergy += tier.exergy;
          hasAnyExergy = true;
        }
        if (tier.starfall !== null) {
          cumulativeStarfall += tier.starfall;
          hasAnyStarfall = true;
        }
        
        const tierStr = tier.tier.padEnd(5);
        const exergyStr = (tier.exergy ? formatNumber(tier.exergy) : 'Unknown').padStart(17);
        const totalExergyStr = (hasAnyExergy ? formatNumber(cumulativeExergy) : 'Unknown').padStart(16);
        const starfallStr = (tier.starfall !== null ? formatNumber(tier.starfall) : 'Unknown').padStart(19);
        const totalStarfallStr = (hasAnyStarfall ? formatNumber(cumulativeStarfall) : 'Unknown').padStart(16);
        
        table += `${tierStr}| ${exergyStr} | ${totalExergyStr} | ${starfallStr} | ${totalStarfallStr}\n`;
      });
      
      table += '```';
      embed.addFields({ name: '📈 Tier Requirements', value: table });
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

      // Unified table format (same as tier-based)
      const sampleItem = research.items[0];
      const hasExergy = sampleItem.exergyCosts && sampleItem.exergyCosts.length > 0;
      const hasStarfall = sampleItem.starfallCosts && sampleItem.starfallCosts.length > 0;
      
      let costTable = '```\n';
      costTable += 'Lvl  | :diamonds: Exergy | Total :diamonds: | :moneybag: Starfall | Total :moneybag:\n';
      costTable += '-----|-------------------|------------------|---------------------|------------------\n';
      
      let cumulativeExergy = 0;
      let cumulativeStarfall = 0;
      const maxLevels = hasExergy ? sampleItem.exergyCosts.length : (hasStarfall ? sampleItem.starfallCosts.length : 0);
      
      for (let i = 0; i < maxLevels; i++) {
        const level = (i + 1).toString().padEnd(5);
        
        const exergyCost = hasExergy ? sampleItem.exergyCosts[i] : null;
        const starfallCost = hasStarfall ? sampleItem.starfallCosts[i] : null;
        
        if (exergyCost) cumulativeExergy += exergyCost;
        if (starfallCost) cumulativeStarfall += starfallCost;
        
        const exergyStr = (exergyCost !== null ? formatNumber(exergyCost) : 'Unknown').padStart(17);
        const totalExergyStr = (exergyCost !== null ? formatNumber(cumulativeExergy) : 'Unknown').padStart(16);
        const starfallStr = (starfallCost !== null ? formatNumber(starfallCost) : 'Unknown').padStart(19);
        const totalStarfallStr = (starfallCost !== null ? formatNumber(cumulativeStarfall) : 'Unknown').padStart(16);
        
        costTable += `${level}| ${exergyStr} | ${totalExergyStr} | ${starfallStr} | ${totalStarfallStr}\n`;
      }
      
      costTable += '```';
      embed.addFields({ name: '📋 Upgrade Costs', value: costTable });

      // Show summary - always show both currencies for consistency
      const totalExergyToMax = hasExergy ? sampleItem.exergyCosts.reduce((a, b) => a + b, 0) : null;
      const totalStarfallToMax = hasStarfall ? sampleItem.starfallCosts.reduce((a, b) => a + b, 0) : null;
      
      const exergyOne = totalExergyToMax !== null ? formatNumber(totalExergyToMax) : 'Unknown';
      const exergyAll = totalExergyToMax !== null ? formatNumber(totalExergyToMax * research.items.length) : 'Unknown';
      const starfallOne = totalStarfallToMax !== null ? formatNumber(totalStarfallToMax) : 'Unknown';
      const starfallAll = totalStarfallToMax !== null ? formatNumber(totalStarfallToMax * research.items.length) : 'Unknown';
      
      const summaryText = 
        `**One item:** ${exergyOne} :diamonds: • ${starfallOne} :moneybag:\n` +
        `**All ${research.items.length} items:** ${exergyAll} :diamonds: • ${starfallAll} :moneybag:`;
      
      embed.addFields({
        name: '💰 Total Cost to Max',
        value: summaryText,
        inline: false
      });
    }

    embed.setFooter({ text: '💡 Plan wisely • 🔬 Research smarter, not harder' });

    return interaction.reply({ 
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};
