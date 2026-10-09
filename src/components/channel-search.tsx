import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useTheme } from '@/hooks/use-theme';
import { channelUrl } from '@/services/youtube';
import { useStore } from '@/store/store';

const MAX_RESULTS = 8;

/** 대소문자·띄어쓰기를 무시하고 비교하기 위한 정규화. */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

/**
 * 상단 바의 '내 구독 채널 검색' 입력창.
 * 채널 이름(우선)과 소개글에서 찾고, 결과를 누르면 유튜브 채널을 새 창으로 연다.
 */
export function ChannelSearch({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const channels = useStore((s) => s.channels);
  const categories = useStore((s) => s.categories);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    const byTitle = channels.filter((c) => norm(c.title).includes(q));
    const byDesc = channels.filter((c) => !norm(c.title).includes(q) && norm(c.description ?? '').includes(q));
    // 이름이 검색어로 시작하는 채널을 맨 앞에
    byTitle.sort((a, b) => Number(norm(b.title).startsWith(q)) - Number(norm(a.title).startsWith(q)));
    return [...byTitle, ...byDesc];
  }, [channels, query]);

  const open = (index: number) => {
    const ch = results[index];
    if (!ch) return;
    Linking.openURL(channelUrl(ch));
    setQuery('');
  };

  const showPanel = focused && query.trim().length > 0;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[
          styles.inputBox,
          compact && styles.inputBoxCompact,
          { backgroundColor: theme.background, borderColor: focused ? '#ff9fd8' : theme.backgroundSelected },
        ]}>
        <MaterialCommunityIcons name="magnify" size={compact ? 16 : 18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          // 결과를 누를 시간을 주고 닫는다
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyPress={(e) => {
            const key = e.nativeEvent.key;
            if (key === 'ArrowDown') setActive((i) => Math.min(i + 1, Math.min(results.length, MAX_RESULTS) - 1));
            else if (key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0));
            else if (key === 'Escape') setQuery('');
          }}
          onSubmitEditing={() => open(active)}
          placeholder={compact ? '검색' : '내 구독 채널 검색'}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, compact && styles.inputCompact, { color: theme.text }]}
          aria-label="내 구독 채널 검색"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} aria-label="검색어 지우기" hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {showPanel && (
        <View style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
          {results.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              ‘{query.trim()}’ 와(과) 맞는 구독 채널이 없어요
            </Text>
          ) : (
            <>
              <Text style={[styles.count, { color: theme.textSecondary }]}>
                구독 채널 {results.length}개
              </Text>
              {results.slice(0, MAX_RESULTS).map((ch, i) => {
                const cat = ch.categoryId ? categoryById.get(ch.categoryId) : undefined;
                const parent = cat?.parentId ? categoryById.get(cat.parentId) : undefined;
                return (
                  <Pressable
                    key={ch.id}
                    onPress={() => open(i)}
                    onHoverIn={() => setActive(i)}
                    style={[styles.row, i === active && { backgroundColor: theme.backgroundElement }]}>
                    <Avatar title={ch.title} color={cat?.color ?? '#9CA3AF'} thumbnail={ch.thumbnail} size={32} />
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                      {ch.title}
                    </Text>
                    <View style={[styles.catChip, { backgroundColor: (cat?.color ?? '#9CA3AF') + '22' }]}>
                      <Text style={[styles.catText, { color: theme.text }]} numberOfLines={1}>
                        {cat ? `${cat.emoji} ${parent ? `${parent.name} › ` : ''}${cat.name}` : '미분류'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              {results.length > MAX_RESULTS && (
                <Text style={[styles.more, { color: theme.textSecondary }]}>
                  검색어를 더 입력하면 나머지 {results.length - MAX_RESULTS}개도 좁혀 볼 수 있어요
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, maxWidth: 420, minWidth: 0, marginHorizontal: 12, marginRight: 'auto', zIndex: 10 },
  wrapCompact: { marginHorizontal: 2, minWidth: 40 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 2,
  },
  inputBoxCompact: {
    height: 34,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1.5,
  },
  input: { flex: 1, minWidth: 0, fontSize: 14, outlineStyle: 'none' } as object,
  inputCompact: { fontSize: 12 },
  panel: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    minWidth: 280,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  count: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    cursor: 'pointer',
  },
  title: { flex: 1, fontSize: 14, fontWeight: '600' },
  catChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, maxWidth: 140 },
  catText: { fontSize: 11, fontWeight: '600' },
  empty: { fontSize: 13, padding: 12 },
  more: { fontSize: 12, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 },
});
