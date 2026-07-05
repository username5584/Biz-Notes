import React, { useCallback, useEffect } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useColors } from '@/hooks';
import { WheelColumn } from './WheelColumn';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimePickerContentProps {
  value: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  animProgress: import('react-native-reanimated').SharedValue<number>;
}

export const TimePickerContent = React.memo(function TimePickerContent({
  value,
  onConfirm,
  onDismiss,
  animProgress,
}: TimePickerContentProps) {
  const colors = useColors();
  const [hour, setHour] = React.useState(value.getHours());
  const [minute, setMinute] = React.useState(value.getMinutes());

  
  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });

    return () => subscription.remove();
  }, [onDismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: animProgress.value * 0.6,
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      animProgress.value,
      [0, 1],
      [300, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }] };
  });

  const confirmTime = useCallback(() => {
    const d = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      hour,
      minute,
      0,
      0,
    );
    onConfirm(d);
    onDismiss();
  }, [value, hour, minute, onConfirm, onDismiss]);

  const handleSetHour = useCallback((h: number) => setHour(h), []);
  const handleSetMinute = useCallback((m: number) => setMinute(m), []);

  return (
    <View style={styles.modalContainer} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto">
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onDismiss} />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, { backgroundColor: colors.card }, sheetStyle]}
        pointerEvents="auto"
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.mutedForeground }]}>Время</Text>
        </View>
        <View style={styles.wheelsRow}>
          <WheelColumn
            items={HOURS}
            selectedIndex={hour}
            onSelect={handleSetHour}
            foreground={colors.foreground}
            primary={colors.primary}
            border={colors.border}
          />
          <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
          <WheelColumn
            items={MINUTES}
            selectedIndex={minute}
            onSelect={handleSetMinute}
            foreground={colors.foreground}
            primary={colors.primary}
            border={colors.border}
          />
        </View>
        <View style={styles.confirmRow}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={confirmTime}
            activeOpacity={0.85}
          >
            <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
              Выбрать время
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backdropTouch: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shouldRasterizeIOS: true,
        }
      : {}),
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  confirmRow: { paddingHorizontal: 20, paddingTop: 12 },
  confirmBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  colon: { fontSize: 32, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
});
