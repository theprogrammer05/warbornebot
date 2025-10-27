import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all commands
for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (command.default?.name && command.default?.description) {
      commands.push(command.default);
      console.log(`✅ Loaded command: ${command.default.name}`);
    }
  } catch (error) {
    console.error(`❌ Error loading command ${file}:`, error);
  }
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log('🚀 Starting command deployment...');
    
    // Clear all existing global commands
    console.log('🔄 Clearing existing global commands...');
    const existingCommands = await rest.get(
      Routes.applicationCommands(CLIENT_ID)
    );
    
    const deletePromises = existingCommands.map(command => 
      rest.delete(Routes.applicationCommand(CLIENT_ID, command.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${deletePromises.length} existing global commands.`);
    
    // Deploy new commands globally
    console.log('🔄 Deploying new global commands...');
    const commandJSONs = commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || []
    }));
    
    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commandJSONs }
    );
    
    // Also update the guild commands (for testing)
    if (process.env.GUILD_ID) {
      console.log('🔄 Also updating guild commands for testing...');
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID),
        { body: commandJSONs }
      );
    }
    
    console.log(`✅ Successfully deployed ${data.length} commands!`);
    console.log('✨ Deployment complete!');
  } catch (error) {
    console.error('❌ Error during deployment:', error);
  }
}

deployCommands();
