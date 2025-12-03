// utility helpers for time calculations
export const UNIT_MS = {
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
};

export function computeTotalMs({ days = 0, hours = 0, minutes = 0, seconds = 0 }) {
  return (Number(days) || 0) * UNIT_MS.days
    + (Number(hours) || 0) * UNIT_MS.hours
    + (Number(minutes) || 0) * UNIT_MS.minutes
    + (Number(seconds) || 0) * UNIT_MS.seconds;
}

export function msToParts(ms) {
  const days = Math.floor(ms / UNIT_MS.days);
  const hours = Math.floor((ms % UNIT_MS.days) / UNIT_MS.hours);
  const minutes = Math.floor((ms % UNIT_MS.hours) / UNIT_MS.minutes);
  const seconds = Math.floor((ms % UNIT_MS.minutes) / UNIT_MS.seconds);
  return { days, hours, minutes, seconds };
}

export function pad(n) {
  return String(n).padStart(2, '0');
}
