import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components';
import { GoogleDriveSyncSection } from '@/components/features/GoogleDriveSyncSection';
import { type StorageMode, useNotes } from '@/context';
import { useColors } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SETTINGS_CARD_SHADOW } from '@/utils/styles';
import { PRESS_TIMING_IN, PRESS_TIMING_OUT, EASE_IN, EASE_OUT } from '@/constants';


const CARD_SHADOW = SETTINGS_CARD_SHADOW;


interface StorageOptionProps {
  title: string;
  description: string;
  icon: IconName;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const StorageOption = React.memo(function StorageOption({
  title,
  description,
  icon,
  active,
  disabled,
  onPress,
}: StorageOptionProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      cancelAnimation(scale);
      scale.value = withTiming(0.97, { duration: PRESS_TIMING_IN, easing: EASE_IN });
    }
  }, [disabled]);

  const handlePressOut = useCallback(() => {
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          animStyle,
          styles.option,
          active
            ? { backgroundColor: colors.primary }
            : [{ backgroundColor: colors.card }, CARD_SHADOW],
          disabled && { opacity: 0.4 },
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: active ? 'rgba(253,252,249,0.15)' : colors.muted },
          ]}
        >
          <Icon name={icon} size={20} color={active ? colors.primaryForeground : colors.foreground} />
        </View>
        <View style={styles.optionText}>
          <Text
            style={[
              styles.optionTitle,
              { color: active ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.optionDesc,
              { color: active ? 'rgba(253,252,249,0.65)' : colors.mutedForeground },
            ]}
          >
            {description}
          </Text>
        </View>
        {active && <Icon name="check" size={16} color={colors.primaryForeground} />}
      </Animated.View>
    </Pressable>
  );
});

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    storageMode,
    switchStorageMode,
    notes,
  } = useNotes();
  const [switching, setSwitching] = useState(false);
  const [pendingMode, setPendingMode] = useState<StorageMode | null>(null);

  
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pendingMode) {
        setPendingMode(null);
        return true;
      }
      
      return false;
    });

    return () => subscription.remove();
  }, [pendingMode]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const selectMode = useCallback((target: StorageMode) => {
    if (target !== storageMode && !switching) setPendingMode(target);
  }, [storageMode, switching]);

  const confirmSwitch = useCallback(async () => {
    if (!pendingMode) return;
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSwitching(true);
    const mode = pendingMode;
    setPendingMode(null);
    try {
      await switchStorageMode(mode);
    } catch {
      
    } finally {
      setSwitching(false);
    }
  }, [pendingMode, switchStorageMode]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')} hitSlop={8}>
          <Icon name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Настройки</Text>
        <View style={styles.placeholder} />
      </View>

      {pendingMode && (
        <View style={[styles.confirmBar, { backgroundColor: '#FFFBEB', borderBottomColor: '#FDE68A' }]}>
          <Text style={[styles.confirmText, { color: '#92400E' }]}>
            {pendingMode === 'sqlite'
              ? `Перенести ${notes.length} заметок в SQLite?`
              : `Перенести ${notes.length} заметок в файловую систему?`}
          </Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#F0EFEC' }]}
              onPress={() => setPendingMode(null)}
            >
              <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={confirmSwitch}
            >
              <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
                Перенести
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ХРАНИЛИЩЕ ДАННЫХ
        </Text>

        <StorageOption
          title="SQLite"
          description="Локальная база данных."
          icon="database"
          active={storageMode === 'sqlite'}
          onPress={() => selectMode('sqlite')}
        />

        <StorageOption
          title="Файловая система"
          description={
            Platform.OS === 'web'
              ? 'Недоступно в браузере.'
              : 'Заметки как JSON-файлы.'
          }
          icon="folder"
          active={storageMode === 'filesystem'}
          disabled={Platform.OS === 'web'}
          onPress={() => selectMode('filesystem')}
        />

        {switching && (
          <View style={styles.switchingRow}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
            <Text style={[styles.switchingText, { color: colors.mutedForeground }]}>
              Перенос данных...
            </Text>
          </View>
        )}

        <View style={[styles.statsCard, { backgroundColor: colors.card }, CARD_SHADOW]}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Всего заметок</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{notes.length}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Хранилище</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {storageMode === 'sqlite' ? 'SQLite' : 'Файлы'}
            </Text>
          </View>
        </View>

        <GoogleDriveSyncSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  placeholder: { width: 38 },
  confirmBar: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  confirmText: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  confirmBtns: { flexDirection: 'row', gap: 8 },
  confirmBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 22, gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    gap: 14,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 3, letterSpacing: -0.1 },
  optionDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  switchingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4 },
  switchingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  statsCard: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statDivider: { height: StyleSheet.hairlineWidth },
});