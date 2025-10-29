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
        embed.addFields({ name: '📈 Tier Requirements - :diamonds: Exergy & :moneybag: Starfall', value: table });
      } else {
        // Drifter/Equipment tier formatting
        let table = '```\n';
        table += 'Tier  | Exergy\n';
        table += '------|---------\n';
        
        research.tiers.forEach(tier => {
          table += `${tier.tier.padEnd(6)}| ${formatNumber(tier.exergy)}\n`;
        });
        table += '```';
        embed.addFields({ name: '📈 Tier Requirements - :diamonds: Exergy', value: table });
      }
    }

    // Handle item-based research with level costs (drifter_stats, armor_weapon_boosts)
    if (research.items && research.items.length > 0) {
      // Show metadata
      if (research.baseExergyCost || research.baseStarfallCost) {
        let upgradeInfo = `⚡ Primary Resource: **${research.resource}**\n`;
        upgradeInfo += `🎯 Max Level: **${research.maxLevel}**\n\n`;
        
        if (research.baseExergyCost && research.exergyMultiplier) {
          upgradeInfo += `💎 **Exergy:**\n`;
          upgradeInfo += `   • Base Cost: **${formatNumber(research.baseExergyCost)}**\n`;
          upgradeInfo += `   • Multiplier: **${research.exergyMultiplier}x**\n`;
        }
        
        if (research.baseStarfallCost && research.starfallMultiplier) {
          upgradeInfo += `\n💰 **Starfall:**\n`;
          upgradeInfo += `   • Base Cost: **${formatNumber(research.baseStarfallCost)}**\n`;
          upgradeInfo += `   • Multiplier: **${research.starfallMultiplier}x**\n`;
        }
        
        embed.addFields({
          name: '📊 Upgrade Info',
          value: upgradeInfo,
          inline: false
        });
      }

      // For each item, show a compact cost table with cumulative
      const sampleItem = research.items[0];
      const hasExergy = sampleItem.exergyCosts && sampleItem.exergyCosts.length > 0;
      const hasStarfall = sampleItem.starfallCosts && sampleItem.starfallCosts.length > 0;
      
      let costTable = '```\n';
      
      // Build header based on available cost types
      if (hasExergy && hasStarfall) {
        costTable += 'Lvl | Exergy Cost | Total Exergy | Starfall Cost | Total Starfall\n';
        costTable += '----|-------------|--------------|---------------|----------------\n';
      } else if (hasExergy) {
        costTable += 'Lvl | Exergy Cost | Total Exergy\n';
        costTable += '----|-------------|---------------\n';
      }
      
      let cumulativeExergy = 0;
      let cumulativeStarfall = 0;
      
      const maxLevels = hasExergy ? sampleItem.exergyCosts.length : sampleItem.starfallCosts.length;
      
      for (let i = 0; i < maxLevels; i++) {
        const level = (i + 1).toString().padStart(3);
        
        if (hasExergy && hasStarfall) {
          const exergyCost = sampleItem.exergyCosts[i];
          const starfallCost = sampleItem.starfallCosts[i];
          cumulativeExergy += exergyCost;
          cumulativeStarfall += starfallCost;
          
          costTable += `${level} | ${formatNumber(exergyCost).padStart(11)} | ${formatNumber(cumulativeExergy).padStart(12)} | ${formatNumber(starfallCost).padStart(13)} | ${formatNumber(cumulativeStarfall).padStart(14)}\n`;
        } else if (hasExergy) {
          const exergyCost = sampleItem.exergyCosts[i];
          cumulativeExergy += exergyCost;
          
          costTable += `${level} | ${formatNumber(exergyCost).padStart(11)} | ${formatNumber(cumulativeExergy).padStart(13)}\n`;
        }
      }
      
      costTable += '```';
      
      let fieldName = `💎 ${sampleItem.name} (Sample - All items have same costs)`;
      if (hasExergy && !hasStarfall) {
        fieldName = `💎 ${sampleItem.name} - :diamonds: Exergy Costs (All items same)`;
      } else if (hasExergy && hasStarfall) {
        fieldName = `💎 ${sampleItem.name} - :diamonds: Exergy & :moneybag: Starfall Costs (All items same)`;
      }
      
      embed.addFields({ 
        name: fieldName, 
        value: costTable 
      });

      // Show summary
      const totalExergyToMax = hasExergy ? sampleItem.exergyCosts.reduce((a, b) => a + b, 0) : 0;
      const totalStarfallToMax = hasStarfall ? sampleItem.starfallCosts.reduce((a, b) => a + b, 0) : 0;
      
      let summaryText = '';
      if (hasExergy) {
        summaryText += `**Total to max one item:** ${formatNumber(totalExergyToMax)} :diamonds: Exergy\n`;
        summaryText += `**Total for all ${research.items.length} items:** ${formatNumber(totalExergyToMax * research.items.length)} :diamonds: Exergy\n`;
      }
      if (hasStarfall) {
        summaryText += `**Total to max one item:** ${formatNumber(totalStarfallToMax)} :moneybag: Starfall\n`;
        summaryText += `**Total for all ${research.items.length} items:** ${formatNumber(totalStarfallToMax * research.items.length)} :moneybag: Starfall`;
      }
      
      embed.addFields({
        name: '💰 Cost Summary',
        value: summaryText,
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
