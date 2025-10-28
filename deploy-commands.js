import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

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
    
    // Clear guild commands if GUILD_ID exists (to remove old duplicates)
    if (GUILD_ID) {
      console.log('🔄 Clearing existing guild commands...');
      try {
        const existingGuildCommands = await rest.get(
          Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
        );
        
        const deleteGuildPromises = existingGuildCommands.map(command => 
          rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id))
        );
        
        await Promise.all(deleteGuildPromises);
        console.log(`✅ Cleared ${deleteGuildPromises.length} guild commands.`);
      } catch (err) {
        console.log('⚠️ No guild commands to clear or error:', err.message);
      }
    }
    
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
    
    console.log(`✅ Successfully deployed ${data.length} global commands!`);
    console.log('✨ Deployment complete! Commands will be available in ~1 minute.');
  } catch (error) {
    console.error('❌ Error during deployment:', error);
    console.error('⚠️ Command deployment failed, but bot will continue to start...');
    // Don't exit with error code - allow bot to start anyway
  }
}

deployCommands().catch(err => {
  console.error('❌ Fatal error during command deployment:', err);
  // Still don't exit with error - Railway should start the bot
});
