/**
 * Time Utilities
 * Shared functions for parsing and formatting times in CST/CDT timezone.
 * Uses native JavaScript with Intl API for DST handling.
 */

const TIMEZONE = 'America/Chicago';

export function parseTimeString(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return [null, null];
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toLowerCase();
  
  if (period === 'pm' && hours < 12) hours += 12;
  else if (period === 'am' && hours === 12) hours = 0;
  
  return [hours, minutes];
}

export function validateAndFormatTime(timeStr) {
  const [hours, minutes] = parseTimeString(timeStr.trim());
  if (hours === null) return null;
  
  const displayHours = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function getCentralTime() {
  // Get current time in America/Chicago timezone
  const now = new Date();
  const centralString = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(centralString);
}

export function createCentralDate(year, month, day, hours, minutes) {
  // Create date in local timezone first
  const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes, 0);
  
  // Format it as if it's in Chicago timezone
  const chicagoFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const chicagoString = chicagoFormatter.format(localDate);
  const chicagoDate = new Date(chicagoString);
  
  // Calculate offset and adjust
  const offset = localDate.getTime() - chicagoDate.getTime();
  
  // Create the target date with the opposite offset
  const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes, 0);
  return new Date(targetDate.getTime() + offset);
}
