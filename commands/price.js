import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Calculate gear cost from input values')
        .addStringOption(option =>
            option.setName('values')
                  .setDescription('Comma-separated: StarfallTokenCost,StarfallChest,SolrbiteCost')
                  .setRequired(true)
        ),
    async execute(interaction) {
        const input = interaction.options.getString('values');
        const parts = input.split(',').map(p => parseFloat(p.trim()));

        if (parts.length !== 3 || parts.some(isNaN)) {
            return interaction.reply('❌ Invalid input. Use format: StarfallCost,ChestSize,SolrbiteCost');
        }

        const [starfallCost, chestSize, solarbiteCost] = parts;
        const result = ((starfallCost / chestSize) * solarbiteCost) * 0.94;

        interaction.reply(`💰 Calculated Break Even Cost: ${result.toLocaleString()}`);
    }
};
