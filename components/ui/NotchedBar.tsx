import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { BUTTON_TIMING_DURATION, PRESS_TIMING_IN, PRESS_TIMING_OUT, PRESS_SCALE_FAB, PRESS_SCALE_ICON, EASE_IN, EASE_OUT } from '@/constants';
import { Icon } from '@/components/ui/Icon';

export const FAB_SIZE = 60;
export const NOTCH_DEPTH = 36;
export const BAR_BELOW = 22;

const FAB_RADIUS = FAB_SIZE / 2;
const NOTCH_HW = 34;
const NOTCH_BEVEL = 24;
const ICON_INSET = 40;
const ICON_SIZE = 28;
const ICON_BTN_SIZE = 52;
const BAR_RADIUS = 22;


const FAB_SHADOW_NATIVE = {
  elevation: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.22,
  shadowRadius: 8,
};
const FAB_SHADOW_WEB = { boxShadow: '0px 4px 14px rgba(0,0,0,0.30)' };
const BAR_SHADOW_WEB = { filter: 'drop-shadow(0px -6px 20px rgba(0,0,0,0.13))' };


import { useColors } from '@/hooks';

interface NotchedBarProps {
  bottomPad: number;
  onSearch: () => void;
  onAdd: () => void;
  onSettings: () => void;
}

const AnimatedIconBtn = React.memo(function AnimatedIconBtn({
  onPress,
  name,
  color,
  style,
}: {
  onPress: () => void;
  name: import('@/components/ui/Icon').IconName;
  color: string;
  style: object;
}) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    opacity.value = withTiming(0.5, { duration: BUTTON_TIMING_DURATION });
    scale.value = withTiming(PRESS_SCALE_ICON, { duration: PRESS_TIMING_IN, easing: EASE_IN });
  }, []);

  const handlePressOut = useCallback(() => {
    opacity.value = withTiming(1, { duration: BUTTON_TIMING_DURATION });
    scale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={14}
      style={style}
    >
      <Animated.View style={[animStyle, styles.iconBtnInner]}>
        <Icon name={name} size={ICON_SIZE} color={color} />
      </Animated.View>
    </Pressable>
  );
});

export const NotchedBar = React.memo(function NotchedBar({
  bottomPad,
  onSearch,
  onAdd,
  onSettings,
}: NotchedBarProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const mid = width / 2;
  const totalH = NOTCH_DEPTH + BAR_BELOW + bottomPad;

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPressIn = useCallback(() => {
    fabScale.value = withTiming(PRESS_SCALE_FAB, { duration: PRESS_TIMING_IN, easing: EASE_IN });
  }, []);

  const handleFabPressOut = useCallback(() => {
    fabScale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
  }, []);

  const R = BAR_RADIUS;
  const panelW = mid - NOTCH_HW - NOTCH_BEVEL;

  
  const fillD = useMemo(
    () =>
      [
        `M 0 ${R}`,
        `A ${R} ${R} 0 0 1 ${R} 0`,
        `H ${panelW}`,
        `C ${mid - NOTCH_BEVEL} 0 ${mid - NOTCH_HW} ${NOTCH_DEPTH} ${mid} ${NOTCH_DEPTH}`,
        `C ${mid + NOTCH_HW} ${NOTCH_DEPTH} ${mid + NOTCH_BEVEL} 0 ${mid + NOTCH_HW + NOTCH_BEVEL} 0`,
        `H ${width - R}`,
        `A ${R} ${R} 0 0 1 ${width} ${R}`,
        `V ${totalH}`,
        `H 0`,
        `Z`,
      ].join(' '),
    [width, mid, panelW, R, totalH],
  );

  const strokeD = useMemo(
    () =>
      [
        `M ${R} 0`,
        `H ${panelW}`,
        `C ${mid - NOTCH_BEVEL} 0 ${mid - NOTCH_HW} ${NOTCH_DEPTH} ${mid} ${NOTCH_DEPTH}`,
        `C ${mid + NOTCH_HW} ${NOTCH_DEPTH} ${mid + NOTCH_BEVEL} 0 ${mid + NOTCH_HW + NOTCH_BEVEL} 0`,
        `H ${width - R}`,
      ].join(' '),
    [width, mid, panelW, R],
  );

  const fabTop = -(FAB_RADIUS + 4);
  const iconTop = Math.round((totalH - ICON_BTN_SIZE) / 2);

  const shadowStyle = useMemo(
    () => (Platform.OS === 'web' ? BAR_SHADOW_WEB : {}),
    [],
  );

  const fabShadow = useMemo(
    () => (Platform.OS === 'web' ? FAB_SHADOW_WEB : FAB_SHADOW_NATIVE),
    [],
  );

  return (
    <View style={[styles.container, { height: totalH }]}>
      <View style={[styles.svgWrapper, shadowStyle]}>
        <Svg width={width} height={totalH}>
          <Defs>
            <SvgLinearGradient id="edgeFade" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#000" stopOpacity="0" />
              <Stop offset="0.08" stopColor="#000" stopOpacity="0.09" />
              <Stop offset="0.92" stopColor="#000" stopOpacity="0.09" />
              <Stop offset="1" stopColor="#000" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
          <Path d={fillD} fill={colors.card} />
          <Path d={strokeD} fill="none" stroke="url(#edgeFade)" strokeWidth={1.5} />
        </Svg>
      </View>

      <AnimatedIconBtn
        onPress={onSearch}
        name="search"
        color={colors.mutedForeground}
        style={[styles.iconBtn, { left: ICON_INSET, top: iconTop }]}
      />

      <Animated.View
        style={[
          styles.fab,
          fabAnimStyle,
          { top: fabTop, left: mid - FAB_RADIUS, backgroundColor: colors.primary },
          fabShadow,
        ]}
      >
        <Pressable
          onPress={onAdd}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          style={styles.fabPressable}
          android_ripple={{ color: 'rgba(255,255,255,0.25)', radius: FAB_RADIUS, borderless: true }}
        >
          <Icon name="plus" size={28} color={colors.primaryForeground} />
        </Pressable>
      </Animated.View>

      <AnimatedIconBtn
        onPress={onSettings}
        name="settings"
        color={colors.mutedForeground}
        style={[styles.iconBtn, { right: ICON_INSET, top: iconTop }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
  },
  svgWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  iconBtn: {
    position: 'absolute',
    width: ICON_BTN_SIZE,
    height: ICON_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_BTN_SIZE,
    height: ICON_BTN_SIZE,
  },
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_RADIUS,
    overflow: 'hidden',
  },
  fabPressable: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
