import colors, { type ColorPalette } from '@/constants/colors';

export type Colors = ColorPalette & { radius: number };


const COLORS: Colors = { ...colors.light, radius: colors.radius };

export function useColors(): Colors {
  return COLORS;
}
