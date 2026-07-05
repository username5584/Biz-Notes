import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { WheelItem } from './WheelItem';

const ITEM_H = 54;
const PAD = 2;
const PADDING = Array.from({ length: PAD }, () => null);

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  foreground: string;
  primary: string;
  border: string;
}

export const WheelColumn = React.memo(function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  foreground,
  primary,
  border,
}: WheelColumnProps) {
  const ref = useRef<ScrollView>(null);
  const lastSelectedViaScroll = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  const prevSelectedIndex = useRef(selectedIndex);

  
  React.useEffect(() => {
    if (!ref.current) return;
    
    if (lastSelectedViaScroll.current !== selectedIndex) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        ref.current.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      } else if (prevSelectedIndex.current !== selectedIndex) {
        ref.current.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
      }
    }
    lastSelectedViaScroll.current = null;
    prevSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);

  const data = useMemo(
    () => [...PADDING, ...items, ...PADDING] as (string | null)[],
    [items],
  );

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      lastSelectedViaScroll.current = clamped;
      onSelect(clamped);
    },
    [items.length, onSelect],
  );

  const onScrollEndDrag = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number }; decelerate?: boolean } }) => {
      if (!e.nativeEvent.decelerate) {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        lastSelectedViaScroll.current = clamped;
        onSelect(clamped);
      }
    },
    [items.length, onSelect],
  );

  return (
    <View style={styles.wheelWrap}>
      <View
        style={[
          styles.selectionHighlight,
          { borderColor: border, top: ITEM_H * PAD, height: ITEM_H },
        ]}
        pointerEvents="none"
      />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        snapToAlignment="start"
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.9}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        showsVerticalScrollIndicator={false}
        style={styles.wheel}
        nestedScrollEnabled
      >
        {data.map((item, index) => {
          const realIndex = index - PAD;
          const active = realIndex === selectedIndex;
          return (
            <WheelItem
              key={index}
              item={item}
              active={active}
              primary={primary}
              foreground={foreground}
              onPress={() => {
                if (item !== null && realIndex !== selectedIndex) {
                  onSelect(realIndex);
                }
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wheelWrap: {
    width: 100,
    height: 270,
    position: 'relative',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 1,
  },
  wheel: { flex: 1 },
});
