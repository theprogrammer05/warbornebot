import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Calculates gear cost from Starfall and Solarbite values.')
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

        if (!starfallCost || !starfallChest || !solarbite) {
            return interaction.reply(
                '❌ Please provide all numbers!\n' +
                'Correct format: use the three input fields in Discord when typing `/price`.'
            );
        }

        const result = ((starfallCost / starfallChest) * solarbite * 0.94).toLocaleString();

        await interaction.reply(`💰 Result: ${result}`);
    }
};
