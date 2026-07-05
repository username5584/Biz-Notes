export const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export const MONTHS_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function formatIsoShort(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1] ?? ''}`;
}

export function formatNoteMeta(date: string, time: string): string {
  if (!date) return time || '';
  const label = formatIsoShort(date);
  return time ? `${label}  ·  ${time}` : label;
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string, base?: Date): Date {
  if (!iso) return base ? new Date(base) : new Date();
  const [y, m, d] = iso.split('-').map(Number);
  const result = base ? new Date(base) : new Date();
  result.setFullYear(y, m - 1, d);
  return result;
}

export function dateToDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${m}.${d.getFullYear()}`;
}

export function dateToTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeStrToDate(time: string, base?: Date): Date {
  const result = base ? new Date(base) : new Date();
  if (time) {
    const [h, min] = time.split(':').map(Number);
    result.setHours(h ?? 0, min ?? 0, 0, 0);
  }
  return result;
}

export function displayFromIso(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function pluralNotes(count: number): string {
  const abs = Math.abs(count) % 100;
  const mod10 = abs % 10;
  if (abs >= 11 && abs <= 14) return 'заметок';
  if (mod10 === 1) return 'заметка';
  if (mod10 >= 2 && mod10 <= 4) return 'заметки';
  return 'заметок';
}

export function sortNotesByDate<T extends { createdAt: number }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt);
}
