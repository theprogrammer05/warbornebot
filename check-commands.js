/**
 * Discord Command Diagnostic Tool
 * Checks what commands are currently registered with Discord
 */

import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function checkCommands() {
  console.log('🔍 Checking Discord command registry...\n');
  
  // Check global commands
  try {
    console.log('📊 GLOBAL COMMANDS:');
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    
    if (globalCommands.length === 0) {
      console.log('   ⚠️ NO GLOBAL COMMANDS REGISTERED!');
    } else {
      console.log(`   Found ${globalCommands.length} global commands:`);
      globalCommands.forEach(cmd => {
        console.log(`   ✓ ${cmd.name} (ID: ${cmd.id})`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error fetching global commands:', error.message);
  }
  
  console.log('');
  
  // Check guild commands if GUILD_ID exists
  if (GUILD_ID) {
    try {
      console.log(`📊 GUILD COMMANDS (Guild ID: ${GUILD_ID}):`);
      const guildCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
      
      if (guildCommands.length === 0) {
        console.log('   ✅ No guild commands (good - should use global only)');
      } else {
        console.log(`   ⚠️ Found ${guildCommands.length} guild commands (these may cause conflicts!):`);
        guildCommands.forEach(cmd => {
          console.log(`   ! ${cmd.name} (ID: ${cmd.id})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error fetching guild commands:', error.message);
    }
  } else {
    console.log('ℹ️ No GUILD_ID set - skipping guild command check');
  }
}

checkCommands();
