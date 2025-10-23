export default {
    name: 'drifter',
    description: 'Shows Drifter tiers and corresponding values.',
    execute(interaction) {
        const response = `
Tier 8: 36,400 Exergy
Tier 9: 47,300
Tier 10: 61,500
Tier 11: 79,900`;

        interaction.reply(response);
    }
};
