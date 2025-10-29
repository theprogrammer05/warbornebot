/**
 * Nuclear Option: Clear ALL Discord Commands
 * Use this if check-commands.js shows unwanted commands
 */

import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function nuclearClear() {
  console.log('💣 NUCLEAR OPTION: Clearing ALL commands...\n');
  
  try {
    // Clear all global commands
    console.log('🔄 Fetching global commands...');
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    console.log(`📊 Found ${globalCommands.length} global commands`);
    
    if (globalCommands.length > 0) {
      console.log('🗑️ Deleting all global commands...');
      for (const cmd of globalCommands) {
        console.log(`   Deleting: ${cmd.name}`);
        await rest.delete(Routes.applicationCommand(CLIENT_ID, cmd.id));
      }
      console.log('✅ All global commands deleted');
    }
    
    console.log('\n⚠️ All commands cleared!');
    console.log('👉 Now run: npm run deploy');
    console.log('👉 Then tell users to restart Discord (Ctrl+R or Cmd+R)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

nuclearClear();
