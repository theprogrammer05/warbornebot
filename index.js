import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, ANNOUNCE_CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !ANNOUNCE_CHANNEL_ID) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

// Load commands dynamically
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command.default?.name || !command.default?.description) {
    console.warn(`⚠️ Command file ${file} is missing required properties.`);
    continue;
  }
  commands.push(command.default);
}

// Register commands with Discord (guild-specific)
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    const formattedCommands = commands.map(cmd => {
      if (cmd.name === 'price') {
        return {
          ...cmd,
          options: [
            {
              name: 'numbers',
              type: 3, // STRING
              description: 'Starfall Token Cost For Equipment, Starfall Token Chest Cost, Solarbite Cost (for Chest)',
              required: true
            }
          ]
        };
      }
      return cmd;
    });

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: formattedCommands }
    );

    console.log('✅ Successfully registered commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find(cmd => cmd.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

// Automatic daily schedule posting
client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  const scheduleFile = path.join(process.cwd(), 'schedule.json');
  if (!fs.existsSync(scheduleFile)) {
    console.warn('⚠️ schedule.json not found. Automatic posting disabled.');
    return;
  }

  const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Post today's event immediately
  const now = new Date();
  const today = daysOfWeek[now.getDay()];
  const event = schedule[today];

  if (event) {
    const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(console.error);
    if (channel) {
      channel.send(`📅 **${today}'s Event:** ${event}`);
    }
  }

  // Optional: Schedule the next posts at midnight (can be implemented later)
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
