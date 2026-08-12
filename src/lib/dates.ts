/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateToString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date object parsed from YYYY-MM-DD
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns date N days after start date in YYYY-MM-DD format
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateToString(d);
}

/**
 * Returns the difference in calendar days between two YYYY-MM-DD strings (b - a)
 */
export function getDaysDifference(dateStrA: string, dateStrB: string): number {
  const a = parseDateString(dateStrA);
  const b = parseDateString(dateStrB);
  const diffTime = b.getTime() - a.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

/**
 * Pretty formats YYYY-MM-DD to "August 12, 2026"
 */
export function formatPrettyDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = parseDateString(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Pretty formats full ISO timestamp to "August 12, 2026 — 8:42 PM"
 */
export function formatPrettyDateTime(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart} — ${timePart}`;
  } catch (e) {
    return isoStr;
  }
}

/**
 * Evaluates streak statistics from a list of completed date strings (YYYY-MM-DD sorted ascending)
 */
export function calculateUserStreaks(completedDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate and sort dates ascending
  const uniqueDates = Array.from(new Set(completedDates)).sort();

  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const dateStr of uniqueDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = getDaysDifference(prevDate, dateStr);
      if (diff === 1) {
        tempStreak += 1;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    prevDate = dateStr;
  }

  // Determine active current streak (must include today or yesterday)
  const todayStr = getTodayDateString();
  const yesterdayStr = addDaysToDateString(todayStr, -1);

  let currentStreak = 0;
  if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
    // Walk backward from the latest completed date
    let lastDate = uniqueDates[uniqueDates.length - 1];
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const curr = uniqueDates[i];
        const diff = getDaysDifference(curr, lastDate);
        if (diff === 1) {
          currentStreak += 1;
          lastDate = curr;
        } else {
          break;
        }
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(maxStreak, currentStreak)
  };
}
