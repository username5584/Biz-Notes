import React, { useCallback, useEffect, useMemo } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, Extrapolation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import { MONTHS_FULL } from '@/utils';
import { useColors } from '@/hooks';
import { CARD_SPRING } from '@/constants';

const CELL_H = 44;
const SEL_SIZE = 36;

interface CalendarDay {
  day: number;
  kind: 'prev' | 'current' | 'next';
}

function buildCalendar(year: number, month: number): CalendarDay[] {
  const firstDow = new Date(year, month, 1).getDay();
  const leadingDays = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: CalendarDay[] = [];

  for (let i = leadingDays - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, kind: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, kind: 'current' });
  }
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ day: d, kind: 'next' });
  }
  return cells;
}


const SelCircle = React.memo(function SelCircle({ color }: { color: string }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, CARD_SPRING);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return <Animated.View style={[styles.selCircle, { backgroundColor: color }, animStyle]} />;
});

const DayCell = React.memo(function DayCell({
  cell,
  viewMonth,
  viewYear,
  selDay,
  selMonth,
  selYear,
  todayTime,
  onSelect,
}: {
  cell: CalendarDay;
  viewMonth: number;
  viewYear: number;
  selDay: number;
  selMonth: number;
  selYear: number;
  todayTime: number;
  onSelect: (cell: CalendarDay) => void;
}) {
  const colors = useColors();
  const selected =
    cell.kind === 'current' &&
    cell.day === selDay &&
    viewMonth === selMonth &&
    viewYear === selYear;

  const isToday =
    cell.kind === 'current' &&
    new Date(viewYear, viewMonth, cell.day).getTime() === todayTime;

  const isOther = cell.kind !== 'current';

  return (
    <TouchableOpacity
      style={styles.dayCell}
      onPress={() => onSelect(cell)}
      activeOpacity={0.6}
      delayPressIn={0}
    >
      {selected && <SelCircle color={colors.primary} />}
      {isToday && !selected && (
        <View style={[styles.todayRing, { borderColor: colors.primary }]} />
      )}
      <Text
        style={[
          styles.dayText,
          selected
            ? { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }
            : isOther
              ? { color: colors.border }
              : isToday
                ? { color: colors.primary, fontFamily: 'Inter_600SemiBold' }
                : { color: colors.foreground },
        ]}
      >
        {cell.day}
      </Text>
    </TouchableOpacity>
  );
});

interface DatePickerContentProps {
  value: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  animProgress: import('react-native-reanimated').SharedValue<number>;
}

export const DatePickerContent = React.memo(function DatePickerContent({
  value,
  onConfirm,
  onDismiss,
  animProgress,
}: DatePickerContentProps) {
  const colors = useColors();
  const [viewYear, setViewYear] = React.useState(value.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(value.getMonth());
  const [selDay, setSelDay] = React.useState(value.getDate());
  const [selMonth, setSelMonth] = React.useState(value.getMonth());
  const [selYear, setSelYear] = React.useState(value.getFullYear());

  
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

  const todayTime = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);
  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

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

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const selectCell = useCallback(
    (cell: CalendarDay) => {
      let year = viewYear;
      let month = viewMonth;
      if (cell.kind === 'prev') {
        month = viewMonth === 0 ? 11 : viewMonth - 1;
        year = viewMonth === 0 ? viewYear - 1 : viewYear;
      } else if (cell.kind === 'next') {
        month = viewMonth === 11 ? 0 : viewMonth + 1;
        year = viewMonth === 11 ? viewYear + 1 : viewYear;
      }
      setSelDay(cell.day);
      setSelMonth(month);
      setSelYear(year);
      if (cell.kind !== 'current') {
        setViewYear(year);
        setViewMonth(month);
      }
    },
    [viewYear, viewMonth],
  );

  const confirmDate = useCallback(() => {
    const d = new Date(
      selYear,
      selMonth,
      selDay,
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds(),
    );
    onConfirm(d);
    onDismiss();
  }, [value, selYear, selMonth, selDay, onConfirm, onDismiss]);

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
          <Text style={[styles.sheetTitle, { color: colors.mutedForeground }]}>Дата</Text>
        </View>
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            hitSlop={12}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <Icon name="chevron-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {MONTHS_FULL[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            hitSlop={12}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <Icon name="chevron-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.dayNames}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <View key={d} style={styles.dayNameCell}>
              <Text style={[styles.dayNameText, { color: colors.mutedForeground }]}>{d}</Text>
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((cell, i) => (
            <DayCell
              key={i}
              cell={cell}
              selDay={selDay}
              selMonth={selMonth}
              selYear={selYear}
              viewMonth={viewMonth}
              viewYear={viewYear}
              todayTime={todayTime}
              onSelect={selectCell}
            />
          ))}
        </View>
        <View style={styles.confirmRow}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={confirmDate}
            activeOpacity={0.85}
          >
            <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
              Выбрать дату
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  dayNames: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayNameText: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: {
    width: `${100 / 7}%` as unknown as number,
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selCircle: {
    position: 'absolute',
    width: SEL_SIZE,
    height: SEL_SIZE,
    borderRadius: SEL_SIZE / 2,
  },
  todayRing: {
    position: 'absolute',
    width: SEL_SIZE,
    height: SEL_SIZE,
    borderRadius: SEL_SIZE / 2,
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    zIndex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmRow: { paddingHorizontal: 20, paddingTop: 12 },
  confirmBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
