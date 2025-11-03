/**
 * Daily Schedule Poster
 * Handles automatic daily schedule posts at 11:00 PM CST. Posts today's and
 * tomorrow's events to the announcement channel.
 */

import fs from 'fs';
import path from 'path';
import { getCentralTime } from './timeUtils.js';

const scheduleFile = path.join(process.cwd(), 'schedule.json');

const DAY_EMOJIS = {
  'Sunday': '♻️',
  'Monday': '🏆',
  'Tuesday': '⚡',
  'Wednesday': '📈',
  'Thursday': '☢️',
  'Friday': '⚔️',
  'Saturday': '🥩'
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatEventList(events) {
  if (!events.length) return '   • _No events scheduled_';
  
  return events.map((event, i) => {
    let text = `   **${i + 1}.** **Event:** ${event.name}`;
    if (event.times?.length > 0) text += `\n     **Time:** ${event.times.join(', ')} CST`;
    if (event.description) text += `\n     **Description:** ${event.description}`;
    return text;
  }).join('\n\n');
}

export async function postDailySchedule(client, channelId) {
  try {
    const now = getCentralTime();
    const todayIndex = now.getDay();
    const tomorrowIndex = (todayIndex + 1) % 7;
    const today = DAYS_OF_WEEK[todayIndex];
    const tomorrow = DAYS_OF_WEEK[tomorrowIndex];

    const schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    const todayEvents = schedule[today] || [];
    const tomorrowEvents = schedule[tomorrow] || [];

    const channel = await client.channels.fetch(channelId).catch(console.error);
    if (!channel) return console.error('❌ Could not find announcement channel.');

    let message = 
      `📅 **Daily Event Schedule**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${DAY_EMOJIS[today]} **${today}'s Events:**\n` +
      formatEventList(todayEvents);

    if (tomorrowEvents.length > 0) {
      message += `\n\n${DAY_EMOJIS[tomorrow]} **Tomorrow (${tomorrow}):**\n${formatEventList(tomorrowEvents)}`;
    }

    message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Use \`/wb-schedule view\` to see the full week!*`;

    await channel.send(message);
    console.log(`✅ Posted schedule for ${today} (Central Time)`);
  } catch (err) {
    console.error('❌ Error posting schedule:', err);
  }
}

export function scheduleDailyPost(client, channelId) {
  const now = getCentralTime();
  const nextPost = new Date(now);
  
  // Set to 11:00 PM today
  nextPost.setHours(23, 0, 5, 0);
  
  // If 11:00 PM has already passed today, schedule for tomorrow
  if (nextPost <= now) {
    nextPost.setDate(nextPost.getDate() + 1);
  }
  
  const millisUntilPost = nextPost - now;

  console.log(`🕒 Next schedule post in ${Math.round(millisUntilPost / 1000 / 60)} minutes at 11:00 PM (Central Time)`);

  setTimeout(() => {
    postDailySchedule(client, channelId);
    setInterval(() => postDailySchedule(client, channelId), 24 * 60 * 60 * 1000);
  }, millisUntilPost);
}
