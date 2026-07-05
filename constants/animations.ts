import { Easing } from 'react-native-reanimated';


export const CARD_SPRING = {
  damping: 28,
  stiffness: 400,
  mass: 1,
};


export const PRESS_TIMING_IN = 100;
export const PRESS_TIMING_OUT = 130;
export const BUTTON_TIMING_DURATION = 100;
export const MODAL_OPEN_DURATION = 250;
export const MODAL_CLOSE_DURATION = 120;


export const PRESS_SCALE_BTN = 0.93;
export const PRESS_SCALE_FAB = 0.88;
export const PRESS_SCALE_ICON = 0.9;


export const EASE_IN = Easing.bezier(0.25, 0.1, 0.25, 1);
export const EASE_OUT = Easing.bezier(0.25, 0.46, 0.45, 0.94);
export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);
export const EASE_IN_CUBIC = Easing.in(Easing.cubic);


export const AUTO_SYNC_INTERVAL_MS = 30_000;