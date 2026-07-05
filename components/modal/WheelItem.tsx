import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const ITEM_H = 54;

interface WheelItemProps {
  item: string | null;
  active: boolean;
  primary: string;
  foreground: string;
  onPress: () => void;
}


const inactiveTextStyle = {
  color: 'var(--foreground)' as string,
  fontSize: 20,
  fontFamily: 'Inter_400Regular' as const,
};
const activeTextStyle = {
  color: 'var(--primary)' as string,
  fontSize: 28,
  fontFamily: 'Inter_700Bold' as const,
};

export const WheelItem = React.memo(function WheelItem({
  item,
  active,
  primary,
  foreground,
  onPress,
}: WheelItemProps) {
  const scale = useSharedValue(active ? 1 : 0.85);
  const prevActive = useRef(active);

  React.useEffect(() => {
    if (prevActive.current !== active) {
      prevActive.current = active;
      scale.value = withSpring(active ? 1 : 0.85, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [active]);

  const textStyle = active
    ? [styles.wheelText, activeTextStyle, { color: primary }]
    : [styles.wheelText, inactiveTextStyle, { color: foreground }];

  if (item === null) {
    return <View style={styles.wheelItem} />;
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  if (active) {
    return (
      <View style={styles.wheelItem}>
        <Animated.Text style={[textStyle, animStyle]}>
          {item}
        </Animated.Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.wheelItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{item}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  wheelText: { letterSpacing: -0.5, includeFontPadding: false },
});
