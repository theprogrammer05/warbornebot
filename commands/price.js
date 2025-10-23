import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Calculate Gear Cost from input numbers.')
        .addNumberOption(option =>
            option.setName('starfall_cost')
                  .setDescription('Starfall Token Cost (NPC)')
                  .setRequired(true))
        .addNumberOption(option =>
            option.setName('starfall_chest')
                  .setDescription('Starfall Token Chest')
                  .setRequired(true))
        .addNumberOption(option =>
            option.setName('solarbite')
                  .setDescription('Solarbite Cost for Chest')
                  .setRequired(true)),

    async execute(interaction) {
        const starfallCost = interaction.options.getNumber('starfall_cost');
        const starfallChest = interaction.options.getNumber('starfall_chest');
        const solarbite = interaction.options.getNumber('solarbite');

        const result = ((starfallCost / starfallChest) * solarbite * 0.94).toFixed(2);

        await interaction.reply(`Result: ${result}`);
    }
};
