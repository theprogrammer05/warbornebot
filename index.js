import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

// Load commands dynamically
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command.default?.name || !command.default?.description) continue;
  commands.push(command.default);
}

// Register commands
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const formattedCommands = commands.map(cmd => {
      if (cmd.subcommands) {
        return {
          name: cmd.name,
          description: cmd.description,
          options: cmd.subcommands
        };
      }
      return cmd;
    });

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: formattedCommands
    });

    console.log('✅ Commands registered.');
  } catch (err) {
    console.error('❌ Error registering commands:', err);
  }
})();

// Handle command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.find(c => c.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
  }
});

client.login(DISCORD_TOKEN).then(() => console.log(`✅ Bot logged in as ${client.user.tag}`));
