const light = {
  background: '#F2EFE9',
  foreground: '#16151A',
  card: '#FDFCF9',
  primary: '#16151A',
  primaryForeground: '#FDFCF9',
  muted: '#E6E1D9',
  mutedForeground: '#8A857C',
  accent: '#16151A',
  destructive: '#D63031',
  border: '#DDD9D0',
} as const;

export type ColorPalette = typeof light;

const colors = { light, radius: 18 } as const;

export default colors;
