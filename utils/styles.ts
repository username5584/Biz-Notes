import { Platform } from 'react-native';

export function getCardShadow(options?: {
  offsetY?: number;
  opacity?: number;
  radius?: number;
  spread?: number;
  color?: string;
}): object {
  const {
    offsetY = 4,
    opacity = 0.08,
    radius = 16,
    spread = 0,
    color = '#16151A',
  } = options ?? {};

  if (Platform.OS === 'web') {
    return {
      filter: `drop-shadow(${0}px ${offsetY}px ${radius}px rgba(22,21,26,${opacity}))`,
    } as object;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: radius * 0.5 + (spread > 0 ? spread : 0),
  };
}

export const META_SHADOW = getCardShadow({ offsetY: 2, opacity: 0.07, radius: 12 });

export const NOTE_CARD_SHADOW = getCardShadow({ offsetY: 3, opacity: 0.09, radius: 14 });

export const SETTINGS_CARD_SHADOW = getCardShadow({ offsetY: 2, opacity: 0.08, radius: 12 });
