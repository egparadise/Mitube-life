import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/store';
import { SavedVideo } from '@/types';

export type LibraryKind = 'history' | 'playlists' | 'later';

type VideoRef = Omit<SavedVideo, 'at'>;

/** 영상을 유튜브에서 열고 기록에 남긴다. */
export function openVideo(v: VideoRef) {
  const { addToHistory, adminSettings } = useStore.getState();
  addToHistory(v);
  // 관리자 설정 → 재생: Shorts 를 일반 플레이어로 / 새 탭에서 열기
  const url =
    v.isShort && !adminSettings.shortsInPlayer
      ? `https://www.youtube.com/shorts/${encodeURIComponent(v.id)}`
      : `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
  if (Platform.OS === 'web' && !adminSettings.openInNewTab && typeof window !== 'undefined') {
    window.location.href = url;
    return;
  }
  Linking.openURL(url);
}

function timeLabel(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(ms).toLocaleDateString('ko-KR');
}

const META: Record<LibraryKind, { title: string; icon: string; youtube: string; empty: string }> = {
  history: {
    title: '기록',
    icon: 'history',
    youtube: 'https://www.youtube.com/feed/history',
    empty: '마이 튜브에서 연 영상이 여기에 차례로 남아요.',
  },
  playlists: {
    title: '재생목록',
    icon: 'playlist-play',
    youtube: 'https://www.youtube.com/feed/playlists',
    empty: '아직 재생목록이 없어요. 위에서 새로 만들거나, 영상의 ⋮ 버튼으로 담아 보세요.',
  },
  later: {
    title: '나중에 볼 동영상',
    icon: 'clock-outline',
    youtube: 'https://www.youtube.com/playlist?list=WL',
    empty: '영상의 ⋮ 버튼 → "나중에 볼 동영상에 저장"을 누르면 여기에 모여요.',
  },
};

/** 메인 영역에 보여 줄 보관함 화면 (기록 · 재생목록 · 나중에 볼 동영상). */
export function LibraryView({ kind }: { kind: LibraryKind }) {
  const theme = useTheme();
  const history = useStore((s) => s.watchHistory);
  const later = useStore((s) => s.watchLater);
  const playlists = useStore((s) => s.playlists);
  const { removeFromHistory, clearHistory, toggleWatchLater, createPlaylist, deletePlaylist, togglePlaylistItem } =
    useStore.getState();
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const meta = META[kind];

  const openPlaylist = kind === 'playlists' ? playlists.find((p) => p.id === openPlaylistId) : undefined;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        {openPlaylist ? (
          <Pressable onPress={() => setOpenPlaylistId(null)} hitSlop={8} aria-label="재생목록으로 돌아가기">
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name={meta.icon as never} size={26} color="#ff0033" />
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {openPlaylist ? openPlaylist.name : meta.title}
        </Text>
      </View>
      <View style={styles.headerActions}>
        {kind === 'history' && history.length > 0 && (
          <Pressable onPress={clearHistory} style={[styles.ghostBtn, { borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.ghostText, { color: theme.text }]}>기록 모두 지우기</Text>
          </Pressable>
        )}
        {openPlaylist && (
          <Pressable
            onPress={() => {
              deletePlaylist(openPlaylist.id);
              setOpenPlaylistId(null);
            }}
            style={[styles.ghostBtn, { borderColor: theme.backgroundSelected }]}>
            <Text style={[styles.ghostText, { color: '#e11d48' }]}>재생목록 삭제</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => Linking.openURL(meta.youtube)}
          style={[styles.ghostBtn, { borderColor: theme.backgroundSelected }]}>
          <MaterialCommunityIcons name="youtube" size={16} color="#ff0033" />
          <Text style={[styles.ghostText, { color: theme.text }]}>유튜브에서 보기</Text>
        </Pressable>
      </View>
    </View>
  );

  const list = (items: SavedVideo[], onRemove: (v: SavedVideo) => void, removeLabel: string) =>
    items.length === 0 ? (
      <Text style={[styles.empty, { color: theme.textSecondary }]}>
        {openPlaylist ? '이 재생목록은 비어 있어요. 영상의 ⋮ 버튼으로 담아 보세요.' : meta.empty}
      </Text>
    ) : (
      items.map((v) => (
        <View key={v.id} style={styles.item}>
          <Pressable onPress={() => openVideo(v)} style={styles.itemMain}>
            <Image
              source={{ uri: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` }}
              style={styles.thumb}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                {v.isShort ? '⚡ ' : ''}
                {v.title}
              </Text>
              <Text style={[styles.itemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {v.channelTitle} · {timeLabel(v.at)}
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={() => onRemove(v)} hitSlop={8} aria-label={removeLabel} style={styles.removeBtn}>
            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      ))
    );

  let body: React.ReactNode;
  if (kind === 'history') {
    body = list(history, (v) => removeFromHistory(v.id), '기록에서 삭제');
  } else if (kind === 'later') {
    body = list(later, (v) => toggleWatchLater(v), '나중에 볼 동영상에서 삭제');
  } else if (openPlaylist) {
    body = list(openPlaylist.items, (v) => togglePlaylistItem(openPlaylist.id, v), '재생목록에서 삭제');
  } else {
    body = (
      <>
        <View style={styles.newRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="새 재생목록 이름"
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={() => {
              if (!newName.trim()) return;
              createPlaylist(newName);
              setNewName('');
            }}
            style={[styles.newInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <Pressable
            onPress={() => {
              if (!newName.trim()) return;
              createPlaylist(newName);
              setNewName('');
            }}
            style={[styles.primaryBtn, !newName.trim() && { opacity: 0.5 }]}>
            <Text style={styles.primaryText}>만들기</Text>
          </Pressable>
        </View>
        {playlists.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>{meta.empty}</Text>
        ) : (
          <View style={styles.plGrid}>
            {playlists.map((p) => (
              <Pressable key={p.id} onPress={() => setOpenPlaylistId(p.id)} style={styles.plCard}>
                <View style={[styles.plCover, { backgroundColor: theme.backgroundElement }]}>
                  {p.items[0] ? (
                    <Image
                      source={{ uri: p.items[0].thumbnail || `https://i.ytimg.com/vi/${p.items[0].id}/mqdefault.jpg` }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="playlist-music" size={36} color={theme.textSecondary} />
                  )}
                  <View style={styles.plCount}>
                    <MaterialCommunityIcons name="playlist-play" size={14} color="#fff" />
                    <Text style={styles.plCountText}>{p.items.length}개</Text>
                  </View>
                </View>
                <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {header}
      {body}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

/** 영상 카드의 ⋮ 버튼에서 여는 '저장' 메뉴 (나중에 볼 동영상 · 재생목록). */
export function SaveVideoMenu({ video, onClose }: { video: VideoRef | null; onClose: () => void }) {
  const theme = useTheme();
  const later = useStore((s) => s.watchLater);
  const playlists = useStore((s) => s.playlists);
  const { toggleWatchLater, togglePlaylistItem, createPlaylist } = useStore.getState();
  const [newName, setNewName] = useState('');

  if (!video) return null;
  const inLater = later.some((x) => x.id === video.id);

  const create = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName);
    togglePlaylistItem(id, video);
    setNewName('');
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={() => {}}>
          <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={2}>
            {video.title}
          </Text>

          <Pressable onPress={() => toggleWatchLater(video)} style={styles.sheetRow}>
            <MaterialCommunityIcons name={inLater ? 'clock-check' : 'clock-outline'} size={22} color={theme.text} />
            <Text style={[styles.sheetLabel, { color: theme.text }]}>
              {inLater ? '나중에 볼 동영상에서 빼기' : '나중에 볼 동영상에 저장'}
            </Text>
          </Pressable>

          <View style={[styles.sheetDivider, { backgroundColor: theme.backgroundSelected }]} />
          <Text style={[styles.sheetSection, { color: theme.textSecondary }]}>재생목록에 저장</Text>
          {playlists.map((p) => {
            const has = p.items.some((x) => x.id === video.id);
            return (
              <Pressable key={p.id} onPress={() => togglePlaylistItem(p.id, video)} style={styles.sheetRow}>
                <MaterialCommunityIcons
                  name={has ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={has ? '#ff0033' : theme.text}
                />
                <Text style={[styles.sheetLabel, { color: theme.text }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.newRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={create}
              placeholder="새 재생목록 만들어 담기"
              placeholderTextColor={theme.textSecondary}
              style={[styles.newInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable onPress={create} style={[styles.primaryBtn, !newName.trim() && { opacity: 0.5 }]}>
              <Text style={styles.primaryText}>만들기</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.doneBtn}>
            <Text style={[styles.doneText, { color: theme.text }]}>완료</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ghostText: { fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 14, paddingVertical: 32, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 168, aspectRatio: 16 / 9, borderRadius: 10, backgroundColor: '#ddd' },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 13 },
  removeBtn: { padding: 6 },
  newRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  newInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 14 },
  primaryBtn: { backgroundColor: '#ff0033', borderRadius: 10, paddingHorizontal: 16, height: 40, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  plGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  plCard: { width: 220, gap: 6 },
  plCover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plCount: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 16, padding: 16, gap: 4 },
  sheetTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  sheetLabel: { fontSize: 15, flex: 1 },
  sheetDivider: { height: 1, marginVertical: 6 },
  sheetSection: { fontSize: 12, fontWeight: '700' },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  doneText: { fontSize: 15, fontWeight: '700' },
});
