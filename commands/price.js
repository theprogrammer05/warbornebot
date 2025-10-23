import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Calculate gear cost from Starfall, Chest, and Solarbite'),
    async execute(interaction) {
        const input = interaction.options.getString('input') || interaction.content;

        try {
            // Remove all spaces
            const cleaned = input.replace(/\s+/g, '');
            const parts = cleaned.split(',');

            if (parts.length !== 3) {
                throw new Error('Invalid input');
            }

            const [starfallCost, starfallChest, solarbiteCost] = parts.map(Number);

            if (isNaN(starfallCost) || isNaN(starfallChest) || isNaN(solarbiteCost)) {
                throw new Error('Invalid numbers');
            }

            const result = ((starfallCost / starfallChest) * solarbiteCost) * 0.94;

            await interaction.reply(`Calculated Gear Cost: **${Math.round(result)}**`);
        } catch (err) {
            await interaction.reply(
                '❌ Invalid format.\n' +
                'Correct format: `Starfall Token Cost, Starfall Token Chest, Solarbite Cost (for Chest)`\n' +
                'Example: `5000000,340000,30`'
            );
        }
    }
};
