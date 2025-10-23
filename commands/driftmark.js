export default {
    name: 'driftmark',
    description: 'Shows Driftmark tiers and Exergy/Starfall values.',
    execute(interaction) {
        const response = `Tier 5: 1,400 Exergy, 17,300 Starfall (20 minutes)

6\t12,000\t41,300\t4 hours
7\t30,000\t282,000\t1 day 18 hr
8\t45,000\t812,000\t3 days
9\t60,000\t3,890,000\t3 days
10\t90,000\t6,000,000\t3 days`;

        interaction.reply(response);
    }
};
