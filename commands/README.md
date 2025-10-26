# Commands Directory

This directory contains all Discord slash command implementations for WarborneBot.

## Command Structure

Each command file exports a default object with:

```javascript
export default {
  name: 'command-name',           // Slash command name
  description: 'Description',      // Shows in Discord
  options: [...],                  // Command parameters
  async execute(interaction) {     // Command logic
    // Implementation
  }
}
```

## Available Commands

### `/wb-schedule`
**File:** `schedule.js`  
**Purpose:** Display today's game events from the schedule  
**Permissions:** Everyone  
**Data Source:** `schedule.json`

### `/wb-reminder`
**File:** `reminder.js`  
**Purpose:** Set persistent reminders with custom mentions  
**Permissions:** Everyone  
**Features:**
- Supports days, hours, minutes, seconds
- Mention up to 3 users/roles
- Optional @everyone mention
- Cancel button for creator
- Persists across bot restarts

### `/wb-faq`
**File:** `faq.js`  
**Purpose:** Manage frequently asked questions  
**Permissions:** 
- View: Everyone
- Add/Edit/Delete: Administrators only
**Subcommands:**
- `view` - Display an FAQ entry
- `add` - Create a new FAQ entry
- `edit` - Modify an existing FAQ entry
- `delete` - Remove an FAQ entry
**Data Source:** `faq.json`

### `/wb-research`
**File:** `research.js`  
**Purpose:** Display research information  
**Permissions:** Everyone  
**Data Source:** `research.json`

### `/wb-commands`
**File:** `commands.js`  
**Purpose:** List all available bot commands  
**Permissions:** Everyone

## Adding New Commands

1. Create a new file in this directory (e.g., `mycommand.js`)
2. Export the command structure:
   ```javascript
   export default {
     name: 'wb-mycommand',
     description: 'My command description',
     options: [
       {
         name: 'parameter',
         type: 3, // STRING
         description: 'Parameter description',
         required: true
       }
     ],
     async execute(interaction) {
       // Your command logic
       await interaction.reply('Response');
     }
   };
   ```
3. The command will be automatically loaded by `index.js`
4. Restart the bot to register the new command

## Command Option Types

Common Discord option types:

- `3` - STRING
- `4` - INTEGER
- `5` - BOOLEAN
- `6` - USER
- `8` - ROLE
- `9` - MENTIONABLE (user or role)

## Best Practices

- Always use `await interaction.reply()` or `await interaction.followUp()`
- Use `MessageFlags.Ephemeral` for private responses
- Add error handling with try-catch blocks
- Validate user input before processing
- Use descriptive parameter names and descriptions
- Add permission checks where needed
- Log important actions to console

## Testing Commands

1. Deploy commands: `node index.js`
2. Test in Discord with `/command-name`
3. Check Railway logs for errors
4. Verify data persistence in JSON files
