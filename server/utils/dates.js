// Borrowing is date-based, not time-based: all calendar logic uses UTC midnight so results
// do not change with server time zone.
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
export const addDays = (d, days) => new Date(d.getTime() + days * MS_PER_DAY);
export const wholeDaysBetween = (from, to) => Math.round((startOfUtcDay(to) - startOfUtcDay(from)) / MS_PER_DAY);
