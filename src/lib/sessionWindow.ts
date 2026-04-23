import { zonedDateTimeToUtcDate } from "../utils/time";

const SESSION_MINUTES = 30;

function toDate(date: string, startTime: string, hcaTimeZone?: string | null) {
  const hhmm = String(startTime ?? "").slice(0, 5);
  if (hcaTimeZone) {
    try {
      return zonedDateTimeToUtcDate(date, hhmm, hcaTimeZone);
    } catch {
      // fall through to local parse
    }
  }
  return new Date(`${date}T${hhmm}`);
}

export function getSessionEnd(date: string, startTime: string, hcaTimeZone?: string | null) {
  const start = toDate(date, startTime, hcaTimeZone);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + SESSION_MINUTES);
  return end;
}

export function isSessionStarted(date: string, startTime: string, hcaTimeZone?: string | null) {
  return new Date() >= toDate(date, startTime, hcaTimeZone);
}

export function isSessionOver(date: string, startTime: string, hcaTimeZone?: string | null) {
  const end = getSessionEnd(date, startTime, hcaTimeZone);
  return new Date().getTime() > end.getTime();
}

export function isSessionExpiredAfterDays(
  date: string,
  startTime: string,
  days: number,
  hcaTimeZone?: string | null,
) {
  const end = getSessionEnd(date, startTime, hcaTimeZone);
  const cutoff = new Date(end);
  cutoff.setDate(cutoff.getDate() + days);
  return new Date().getTime() > cutoff.getTime();
}

