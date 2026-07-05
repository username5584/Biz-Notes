import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components';
import { useNotes, type Note } from '@/context';
import { useModalPortal } from '@/components/ModalPortal';
import { useColors } from '@/hooks';
import { dateToIso, displayFromIso, isoToDate, pluralNotes } from '@/utils';


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}


const SearchCard = React.memo(function SearchCard({
  item,
  query,
  onPress,
}: {
  item: Note;
  query: string;
  onPress: (note: Note) => void;
}) {
  const colors = useColors();

  
  const highlightedContent = useMemo(() => {
    const text = item.content || '';
    const maxLength = 120;
    
    if (!query.trim()) return text.slice(0, maxLength);
    
    const q = query.toLowerCase();
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text.slice(0, maxLength);
    
    const start = Math.max(0, idx - 10);
    const prefix = start > 0 ? '...' : '';
    const sliced = text.slice(start, start + maxLength);
    const highlightIdx = idx - start;
    const highlightBg = `${colors.primary}30`;
    
    return (
      <Text>
        {prefix}{sliced.slice(0, highlightIdx)}
        <Text style={[styles.highlight, { backgroundColor: highlightBg }]}>
          {sliced.slice(highlightIdx, highlightIdx + q.length)}
        </Text>
        {sliced.slice(highlightIdx + q.length)}
      </Text>
    );
  }, [item.content, query, colors.primary]);

  const title = useMemo(
    () => item.title || 'Без названия',
    [item.title]
  );

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.cardContent, { color: colors.mutedForeground }]} numberOfLines={2}>
        {highlightedContent}
      </Text>
      {item.date && (
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {displayFromIso(item.date)}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notes } = useNotes();
  const { openModal } = useModalPortal();
  const [query, setQuery] = useState('');
  const [filterIso, setFilterIso] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const hasQuery = query.trim().length > 0;

  
  const debouncedQuery = useDebounce(query, 200);

  const results = useMemo(() => {
    return notes.filter(note => {
      if (filterIso && note.date !== filterIso) return false;
      if (!hasQuery) return true;
      const q = debouncedQuery.toLowerCase();
      return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
    });
  }, [notes, debouncedQuery, hasQuery, filterIso]);

  const handleNotePress = useCallback(
    (note: Note) => router.push(`/note/${note.id}`),
    [router],
  );

  
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      
      return false;
    });

    return () => subscription.remove();
  }, []);

  const handleCalendarPress = useCallback(() => {
    const value = filterIso ? isoToDate(filterIso) : new Date();
    openModal({
      type: 'date',
      value,
      onConfirm: (date: Date) => {
        setFilterIso(dateToIso(date));
      },
      onDismiss: () => {},
    });
  }, [filterIso, openModal]);

  const handleClearFilter = useCallback(() => setFilterIso(null), []);

  const renderResult = useCallback(
    ({ item }: { item: Note }) => (
      <SearchCard item={item} query={debouncedQuery} onPress={handleNotePress} />
    ),
    [debouncedQuery, handleNotePress],
  );

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const hasActiveFilter = hasQuery || !!filterIso;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/')} hitSlop={8}>
          <Icon name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View
          style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Icon name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Поиск по заметкам..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.calBtn,
            filterIso
              ? { backgroundColor: colors.primary, borderRadius: 10 }
              : undefined,
          ]}
          onPress={handleCalendarPress}
          hitSlop={8}
        >
          <Icon
            name="calendar"
            size={20}
            color={filterIso ? colors.primaryForeground : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {filterIso && (
        <View style={styles.filterRow}>
          <View style={[styles.filterChip, { backgroundColor: colors.primary }]}>
            <Icon name="calendar" size={12} color={colors.primaryForeground} />
            <Text style={[styles.filterChipText, { color: colors.primaryForeground }]}>
              {displayFromIso(filterIso)}
            </Text>
            <TouchableOpacity onPress={handleClearFilter} hitSlop={8}>
              <Icon name="x" size={13} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {`${results.length} ${pluralNotes(results.length)}`}
          </Text>
        </View>
      )}

      {results.length > 0 && !filterIso && (
        <Text style={[styles.countInline, { color: colors.mutedForeground }]}>
          {`${results.length} ${pluralNotes(results.length)}`}
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderResult}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {hasActiveFilter ? 'Ничего не найдено' : 'Нет заметок'}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              {hasActiveFilter
                ? 'Попробуйте другой запрос или снимите фильтр'
                : 'Создайте первую заметку, чтобы она появилась здесь'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  iconBtn: { padding: 6 },
  calBtn: { padding: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  countText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  countInline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(22,21,26,0.07)' } as object,
      default: {
        shadowColor: '#16151A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.1 },
  cardContent: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  cardMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 6 },
  highlight: { fontWeight: '600' as const },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
  },
});
