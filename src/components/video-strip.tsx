import { Image } from 'expo-image';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { videoUrl } from '@/services/youtube';
import { Video } from '@/types';
import { timeAgo } from '@/utils/format';

interface Props {
  /** 최신순으로 정렬된 영상들. */
  videos: Video[];
  /** 이 시각 이후 게시된 영상에 NEW 표시 (Infinity 면 표시 없음). */
  newSince: number;
  compact?: boolean;
}

/** 채널의 최신 영상을 썸네일로 가로로 나열한다. 누르면 유튜브에서 그 영상이 열린다. */
export function VideoStrip({ videos, newSince, compact }: Props) {
  const theme = useTheme();
  const width = compact ? 120 : 136;
  const height = Math.round((width * 9) / 16);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 카드마다 가로 스크롤이 있으므로, iOS 상태바 탭은 바깥 목록이 받도록 빠진다.
      scrollsToTop={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {videos.map((v) => {
        const isNew = Date.parse(v.publishedAt) > newSince;
        return (
          <Pressable
            key={v.id}
            onPress={() => Linking.openURL(videoUrl(v.id)).catch(() => {})}
            role="link"
            aria-label={`${v.title} 영상 보기`}
            style={({ pressed }) => [styles.item, { width }, pressed && styles.pressed]}>
            <View style={[styles.thumb, { width, height, backgroundColor: theme.backgroundSelected }]}>
              {v.thumbnail ? (
                <Image
                  source={{ uri: v.thumbnail }}
                  style={{ width, height, borderRadius: 6 }}
                  contentFit="cover"
                  transition={150}
                />
              ) : null}
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>NEW</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
              {v.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.meta, { color: isNew ? '#ff0033' : theme.textSecondary }]}>
              {timeAgo(v.publishedAt)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // 가로 ScrollView 는 기본이 flexGrow:1 이라 세로로 늘어날 수 있다 → 내용 높이에 고정.
  scroller: { flexGrow: 0, flexShrink: 0 },
  row: { gap: 10 },
  item: { gap: 3, cursor: 'pointer' },
  pressed: { opacity: 0.7 },
  thumb: {
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#ff0033',
  },
  newText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  meta: {
    fontSize: 10,
    lineHeight: 12,
  },
});
