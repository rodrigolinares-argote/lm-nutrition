/**
 * LM Nutrition — Utilidades de fecha
 * Funciones puras. Sin dependencias externas.
 */

export function todayStr() {
  return toDateStr(new Date());
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

export function formatDisplayDate(dateStr) {
  const today     = todayStr();
  const yesterday = toDateStr(addDays(new Date(), -1));
  if (dateStr === today)     return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  return parseDate(dateStr).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

export function isToday(dateStr) { return dateStr === todayStr(); }

export function lastNDays(n) {
  return Array.from({ length: n }, (_, i) =>
    toDateStr(addDays(new Date(), -(n - 1 - i)))
  );
}
