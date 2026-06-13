// Generates bookable appointment slots for a service on a given day, based on
// the business opening hours and already-booked appointments.

interface OpeningHour {
  weekday: number;
  openMinute: number;
  closeMinute: number;
}

interface BusyInterval {
  start: Date;
  end: Date;
}

export interface Slot {
  startAt: string; // ISO
  endAt: string; // ISO
}

const SLOT_STEP_MIN = 15; // granularity of proposed start times

// Returns the available start times for a service of `durationMin` on `day`.
export function computeSlots(
  day: Date,
  durationMin: number,
  openingHours: OpeningHour[],
  busy: BusyInterval[]
): Slot[] {
  const weekday = day.getDay();
  const windows = openingHours.filter((o) => o.weekday === weekday);
  if (windows.length === 0) return [];

  const slots: Slot[] = [];
  const now = Date.now();

  for (const w of windows) {
    // Walk the opening window in SLOT_STEP_MIN increments.
    for (let m = w.openMinute; m + durationMin <= w.closeMinute; m += SLOT_STEP_MIN) {
      const start = atMinute(day, m);
      const end = atMinute(day, m + durationMin);

      // Skip past slots.
      if (start.getTime() < now) continue;

      // Skip slots that overlap an existing appointment.
      const overlaps = busy.some((b) => start < b.end && end > b.start);
      if (overlaps) continue;

      slots.push({ startAt: start.toISOString(), endAt: end.toISOString() });
    }
  }
  return slots;
}

function atMinute(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}
