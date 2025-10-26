/**
 * COMMANDS COMMAND
 * 
 * Purpose: Display a list of all available bot commands with descriptions
 * 
 * Features:
 * - Dynamically loads all commands from the commands directory
 * - Shows command names and descriptions
 * - Formatted for easy readability
 * - Ephemeral response (only visible to command user)
 * 
 * Example Usage:
 * /wb-commands
 * 
 * Permissions: Everyone
 */

import fs from 'fs';
import path from 'path';
import { MessageFlags } from 'discord.js';

export default {
  name: 'wb-commands',
  description: 'Shows a list of all bot commands.',
  async execute(interaction) {
    try {
      // Get all command files
      const commandsPath = path.join(process.cwd(), 'commands');
      const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js') && file !== 'commands.js');
      
      // Import and collect command info
      const commandsInfo = [];
      
      for (const file of commandFiles) {
        try {
          const command = await import(`./${file}`);
          if (command.default && command.default.name && command.default.description) {
            commandsInfo.push({
              name: command.default.name,
              description: command.default.description
            });
          }
        } catch (error) {
          console.error(`Error loading command ${file}:`, error);
        }
      }

      if (commandsInfo.length === 0) {
        return interaction.reply({
          content: '❌ No commands found.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Format the command list with better styling
      const commandList = commandsInfo
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(cmd => `\`/${cmd.name}\` — ${cmd.description}`)
        .join('\n');

      await interaction.reply({
        content: 
          `🤖 **WarborneBot Commands**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `${commandList}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 *Tip: Use \`/\` to see all commands with autocomplete!*`,
        flags: MessageFlags.Ephemeral
      });
    
    } catch (error) {
      console.error('Error in wb-commands:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching commands.',
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
