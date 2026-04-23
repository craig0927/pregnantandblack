export function format24To12(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

export function convertTimeZone(
  date: string,
  time: string,
  fromTZ: string,
  toTZ: string,
) {
  const iso = `${date}T${time}:00`;

  const d = new Date(
    new Date(iso).toLocaleString("en-US", {
      timeZone: fromTZ,
    }),
  );

  return new Date(
    d.toLocaleString("en-US", {
      timeZone: toTZ,
    }),
  );
}

function parsePartsInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function zonedDateTimeToUtcDate(
  dateISO: string,
  timeHHMM: string,
  timeZone: string,
) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  let utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  for (let i = 0; i < 3; i += 1) {
    const p = parsePartsInTZ(new Date(utcMs), timeZone);
    const target = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
    const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0, 0);
    const diff = target - actual;
    if (diff === 0) break;
    utcMs += diff;
  }
  return new Date(utcMs);
}

/**
 * Converts a wall-clock time stored in the HCA's timezone and formats it
 * for display in the user's local timezone.
 */
export function formatTimeInUserTimeZone(
  dateISO: string,
  timeHHMM: string,
  fromTZ: string,
  toTZ: string,
): string {
  try {
    const utcDate = zonedDateTimeToUtcDate(dateISO, timeHHMM, fromTZ);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: toTZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(utcDate);
  } catch {
    return format24To12(timeHHMM);
  }
}
