import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoogleDriveSync } from '@/context/GoogleDriveSyncContext';
import { useNotes, useNotesList, type Note } from '@/context';
import { useColors } from '@/hooks';
import { AUTO_SYNC_INTERVAL_MS} from '@/constants';
import { Icon, NoteCard, NotchedBar, BAR_BELOW, NOTCH_DEPTH } from '@/components';

const INITIAL_RENDER_COUNT = 10;
const WINDOW_SIZE = 5;
const MAX_RENDER_PER_BATCH = 8;

type Period = 'all' | '3d' | '7d' | '30d';

function AutoSync({ userEmail, sync }: { userEmail: string | null; sync: () => void }) {
  const lastAutoSyncRef = useRef<number>(0);
  
  useFocusEffect(
    useCallback(() => {
      if (!userEmail) return undefined;
      const now = Date.now();
      const elapsed = now - lastAutoSyncRef.current;
      if (elapsed < AUTO_SYNC_INTERVAL_MS) return undefined;
      lastAutoSyncRef.current = now;
      sync();
      return undefined;
    }, [userEmail, sync]),
  );

  return null;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'За всё время' },
  { id: '3d', label: 'За 3 дня' },
  { id: '7d', label: 'За 7 дней' },
  { id: '30d', label: 'За месяц' },
];

function getCutoffDate(period: Exclude<Period, 'all'>): Date {
  const days = period === '3d' ? 3 : period === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: active ? colors.primary : colors.card,
            borderColor: active ? 'transparent' : colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { 
              color: active ? colors.primaryForeground : colors.mutedForeground,
            },
          ]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface NoteActionMenuProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

const NoteActionMenu = React.memo(function NoteActionMenu({
  visible,
  note,
  onClose,
  onOpen,
  onDelete,
}: NoteActionMenuProps) {
  const colors = useColors();
  const noteTitle = useMemo(
    () => note?.title.trim() || 'Без названия',
    [note?.title]
  );

  
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return undefined;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.menuBackdrop}>
        <TouchableOpacity
          style={styles.menuBackdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.menuSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <Text
              style={[styles.menuNoteTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {noteTitle}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onOpen}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.muted }]}>
              <Icon name="edit-3" size={17} color={colors.foreground} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.foreground }]}>
              Открыть
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEEAEA' }]}>
              <Icon name="trash-2" size={17} color={colors.destructive} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.destructive }]}>
              Удалить заметку
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCancel, { borderTopColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuCancelText, { color: colors.mutedForeground }]}>
              Отмена
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoading, deleteNote } = useNotes();
  const notes = useNotesList();
  const { userEmail, sync } = useGoogleDriveSync();
  const [period, setPeriod] = useState<Period>('all');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const filteredNotes = useMemo(() => {
    if (period === 'all') return notes;
    const cutoff = getCutoffDate(period);
    return notes.filter(n => {
      if (!n.date) return false;
      const [y, m, d] = n.date.split('-').map(Number);
      return new Date(y, m - 1, d) >= cutoff;
    });
  }, [notes, period]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const periodHandlers = useMemo(
    () => Object.fromEntries(
      PERIODS.map(({ id }) => [id, () => setPeriod(id)]),
    ) as Record<Period, () => void>,
    [],
  );

  const handleNotePress = useCallback(
    (note: Note) => router.push(`/note/${note.id}`),
    [router],
  );

  const handleNoteLongPress = useCallback((note: Note) => {
    setActiveNote(note);
  }, []);

  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        item={item}
        onPress={handleNotePress}
        onLongPress={handleNoteLongPress}
      />
    ),
    [handleNotePress, handleNoteLongPress],
  );

  const handleAdd = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push('/note/new');
  }, [router]);

  const activeNoteRef = useRef<Note | null>(null);
  useEffect(() => {
    activeNoteRef.current = activeNote;
  }, [activeNote]);

  const closeMenu = useCallback(() => setActiveNote(null), []);

  const openActiveNote = useCallback(() => {
    const note = activeNoteRef.current;
    if (!note) return;
    setActiveNote(null);
    router.push(`/note/${note.id}`);
  }, [router]);

  const deleteActiveNote = useCallback(async () => {
    const note = activeNoteRef.current;
    if (!note) return;
    setActiveNote(null);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    await deleteNote(note.id);
    if (userEmail) sync();
  }, [deleteNote, userEmail, sync]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AutoSync userEmail={userEmail} sync={sync} />
      
      <View style={[styles.header, { paddingTop: topPad + 24 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Заметки</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, styles.filterScroll]}
        contentContainerStyle={styles.filterContent}
      >
        {PERIODS.map(({ id, label }) => (
          <FilterChip
            key={id}
            label={label}
            active={period === id}
            onPress={periodHandlers[id]}
          />
        ))}
      </ScrollView>

      <FlatList
        data={isLoading ? [] : filteredNotes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: NOTCH_DEPTH + BAR_BELOW + bottomPad + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        windowSize={WINDOW_SIZE}
        maxToRenderPerBatch={MAX_RENDER_PER_BATCH}
        initialNumToRender={INITIAL_RENDER_COUNT}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Icon name="file-text" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {period !== 'all' ? 'Нет заметок за этот период' : 'Нет заметок'}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                {period !== 'all'
                  ? 'Выберите другой период или посмотрите все заметки'
                  : 'Нажмите + чтобы создать первую заметку'}
              </Text>
            </View>
          )
        }
      />

      <NotchedBar
        bottomPad={bottomPad}
        onSearch={() => router.push('/search')}
        onAdd={handleAdd}
        onSettings={() => router.push('/settings')}
      />

      <NoteActionMenu
        visible={!!activeNote}
        note={activeNote}
        onClose={closeMenu}
        onOpen={openActiveNote}
        onDelete={deleteActiveNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 26,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -1,
  },
  filterBar: { flexGrow: 0, flexShrink: 0, marginBottom: 10 },
  filterScroll: { overflow: 'visible' },
  filterContent: {
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
    overflow: 'visible',
  },
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 38,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1, 
    borderRadius: 100,
    overflow: 'visible',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    includeFontPadding: false,
  },
  listContent: { paddingHorizontal: 18, paddingTop: 10 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 110,
    gap: 14,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 19, fontFamily: 'Inter_600SemiBold', textAlign: 'center', letterSpacing: -0.3 },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuBackdropTouch: { flex: 1 },
  menuSheet: {
    marginHorizontal: 10,
    marginBottom: 14,
    borderRadius: 24,
    overflow: 'hidden',
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuNoteTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  menuCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  menuCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});