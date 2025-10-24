import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
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

// Register commands globally
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Add options for price command
    const formattedCommands = commands.map(cmd => {
      if (cmd.name === 'price') {
        return {
          ...cmd,
          options: [
            {
              name: 'numbers',
              type: 3, // STRING
              description:
                'Starfall Token Cost For Equipment, Starfall Token Chest Cost, Solarbite Cost (for Chest)',
              required: true,
            },
          ],
        };
      }
      return cmd;
    });

    // Global registration (no GUILD_ID)
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: formattedCommands });

    console.log('✅ Successfully registered commands globally.');
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
    await interaction.reply({
      content: '❌ There was an error executing this command.',
      ephemeral: true,
    });
  }
});

client.login(DISCORD_TOKEN).then(() => console.log('✅ Bot logged in successfully.'));
