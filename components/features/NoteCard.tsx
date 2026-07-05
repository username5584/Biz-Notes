import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { type Note } from '@/context';
import { formatNoteMeta } from '@/utils';
import { NOTE_CARD_SHADOW } from '@/utils/styles';
import { PRESS_TIMING_OUT, EASE_OUT } from '@/constants';
import { useColors } from '@/hooks';


const CARD_SHADOW = NOTE_CARD_SHADOW;

interface NoteCardProps {
  item: Note;
  onPress: (note: Note) => void;
  onLongPress: (note: Note) => void;
}

export const NoteCard = React.memo(function NoteCard({
  item,
  onPress,
  onLongPress,
}: NoteCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const itemRef = useRef(item);
  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.93, { duration: 150, easing: EASE_OUT });
  }, []);

  const handleLongPress = useCallback(() => {
    onLongPress(itemRef.current);
  }, [onLongPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
  }, []);

  const title = useMemo(() => item.title.trim() || 'Без названия', [item.title]);
  const hasContent = item.content.trim().length > 0;

  return (
    <Animated.View style={[animStyle, styles.cardContainer]}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.card }, CARD_SHADOW]}
        onPress={() => onPress(itemRef.current)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={200}
        android_ripple={{ color: colors.muted }}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {title}
        </Text>
        {hasContent ? (
          <Text style={[styles.cardContent, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.content}
          </Text>
        ) : null}
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {formatNoteMeta(item.date, item.time)}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 6,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  cardContent: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  cardMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8, letterSpacing: 0.1 },
});
