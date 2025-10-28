/**
 * Time Utilities
 * Shared functions for parsing and formatting times in CST/CDT timezone.
 * Uses Luxon for proper DST handling.
 */

import { DateTime } from 'luxon';

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
  return DateTime.now().setZone(TIMEZONE).toJSDate();
}

export function createCentralDate(year, month, day, hours, minutes) {
  // Create a DateTime object in America/Chicago timezone
  // Luxon automatically handles DST transitions
  const dt = DateTime.fromObject(
    { year: parseInt(year), month: parseInt(month), day: parseInt(day), hour: hours, minute: minutes, second: 0 },
    { zone: TIMEZONE }
  );
  
  return dt.toJSDate();
}
