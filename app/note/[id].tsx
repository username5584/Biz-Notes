import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRESS_TIMING_IN, PRESS_TIMING_OUT, EASE_IN, EASE_OUT } from '@/constants';
import { DatePickerField, Icon, KeyboardAwareScrollViewCompat } from '@/components';
import { useGoogleDriveSync } from '@/context/GoogleDriveSyncContext';
import { useNotes, useNotesList, type Note } from '@/context';
import { useColors } from '@/hooks';
import {
  dateToDisplay,
  dateToIso,
  dateToTimeStr,
  isoToDate,
  timeStrToDate,
} from '@/utils';
import { META_SHADOW } from '@/utils/styles';


export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoading, createNote, updateNote, deleteNote } = useNotes();
  const notes = useNotesList();
  const { userEmail, sync } = useGoogleDriveSync();

  
  const existing = useMemo(() => {
    if (isNew) return null;
    return notes.find((n: Note) => n.id === id) ?? null;
  }, [isNew, notes, id]);

  const nowRef = useRef(new Date());
  const now = nowRef.current;
  const initializedRef = useRef(false);

  const [title, setTitle] = useState('');
  const [dateObj, setDateObj] = useState<Date>(() => isoToDate(dateToIso(now), now));
  const [timeObj, setTimeObj] = useState<Date>(() => timeStrToDate(dateToTimeStr(now), now));
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const titleRef = useRef<TextInput>(null);

  
  useEffect(() => {
    if (initializedRef.current) return;

    if (isNew) {
      setTitle('');
      setContent('');
      setDateObj(isoToDate(dateToIso(now), now));
      setTimeObj(timeStrToDate(dateToTimeStr(now), now));
      initializedRef.current = true;
    } else if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setDateObj(isoToDate(existing.date, now));
      setTimeObj(timeStrToDate(existing.time, now));
      initializedRef.current = true;
    }
  }, [existing, isNew, now]);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => titleRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isNew]);

  useEffect(() => {
    if (!isNew && !isLoading && !existing) {
      router.replace('/');
    }
  }, [isNew, isLoading, existing, router]);

  
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmDelete) {
        setConfirmDelete(false);
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [confirmDelete]);

  const isEmpty = !title.trim() && !content.trim();

  const saveBtnScale = useSharedValue(1);
  const saveBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveBtnScale.value }],
  }));

  const savingRef = useRef(saving);
  const isEmptyRef = useRef(isEmpty);
  useEffect(() => {
    savingRef.current = saving;
    isEmptyRef.current = isEmpty;
  }, [saving, isEmpty]);

  const isSaveDisabled = saving || isEmpty;

  const existingIdRef = useRef<string | null>(null);
  useEffect(() => {
    existingIdRef.current = existing?.id ?? null;
  }, [existing?.id]);

  const handleSave = useCallback(async () => {
    if (saving || isEmpty) return;
    setSaving(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    try {
      const noteData = {
        title: title.trim(),
        content,
        date: dateToIso(dateObj),
        time: dateToTimeStr(timeObj),
      };
      if (isNew) {
        await createNote(noteData);
      } else {
        const id = existingIdRef.current;
        if (id) {
          await updateNote(id, noteData);
        }
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }, [saving, isEmpty, title, content, dateObj, timeObj, isNew, createNote, updateNote, router]);

  const handleDelete = useCallback(async () => {
    const id = existingIdRef.current;
    if (!id) return;
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    await deleteNote(id);
    router.back();
    if (userEmail) sync();
  }, [deleteNote, router, userEmail, sync]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const headerTitle = isNew ? 'Новая заметка' : 'Редактирование';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.replace('/')} hitSlop={8}>
          <Icon name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {headerTitle}
        </Text>
        {!isNew && !confirmDelete ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setConfirmDelete(true)}
            hitSlop={8}
          >
            <Icon name="trash-2" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {confirmDelete && (
        <View style={[styles.confirmBar, { backgroundColor: '#FEF2F2', borderBottomColor: '#FECACA' }]}>
          <Text style={styles.confirmText}>Удалить эту заметку?</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#F0EFEC' }]}
              onPress={() => setConfirmDelete(false)}
            >
              <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleDelete}
            >
              <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.contentWrapper}>
        <KeyboardAwareScrollViewCompat
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bottomOffset={80}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            ref={titleRef}
            style={[styles.titleInput, { color: colors.foreground }]}
            placeholder="Заголовок"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={150}
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <View style={[styles.metaRow, { backgroundColor: colors.card }, META_SHADOW]}>
            <DatePickerField
              value={dateObj}
              mode="date"
              onChange={setDateObj}
              icon="calendar"
              displayValue={dateToDisplay(dateObj)}
              placeholder="ДД.ММ.ГГГГ"
            />
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <DatePickerField
              value={timeObj}
              mode="time"
              onChange={setTimeObj}
              icon="clock"
              displayValue={dateToTimeStr(timeObj)}
              placeholder="ЧЧ:ММ"
            />
          </View>

          <TextInput
            style={[styles.contentInput, { color: colors.foreground }]}
            placeholder="Начните писать..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </KeyboardAwareScrollViewCompat>
      </View>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: bottomPad + 18,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Animated.View style={saveBtnAnimStyle}>
          <Pressable
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: isSaveDisabled ? 0.35 : 1 },
            ]}
            onPress={handleSave}
            onPressIn={() => {
              if (!savingRef.current && !isEmptyRef.current) {
                cancelAnimation(saveBtnScale);
                saveBtnScale.value = withTiming(0.96, { duration: PRESS_TIMING_IN, easing: EASE_IN });
              }
            }}
            onPressOut={() => {
              cancelAnimation(saveBtnScale);
              saveBtnScale.value = withTiming(1, { duration: PRESS_TIMING_OUT, easing: EASE_OUT });
            }}
            disabled={isSaveDisabled}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerBtn: { padding: 6, width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Inter_500Medium' },
  confirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  confirmText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#B91C1C', flex: 1 },
  confirmBtns: { flexDirection: 'row', gap: 8 },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  confirmBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  contentWrapper: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 24 },
  titleInput: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
    lineHeight: 36,
    marginBottom: 20,
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineWidth: 0, borderWidth: 0 } : {}),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  metaDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  contentInput: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    lineHeight: 28,
    minHeight: 240,
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineWidth: 0, borderWidth: 0 } : {}),
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
});
