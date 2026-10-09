import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { VideoStrip } from '@/components/video-strip';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { channelUrl } from '@/services/youtube';
import { Category, Channel, Video } from '@/types';
import { readableText } from '@/utils/color';
import { formatCount } from '@/utils/format';

interface ChannelCardProps {
  channel: Channel;
  category: Category | null;
  /** '설정' 버튼: 분류함 이동·알림 설정 시트를 연다. */
  onSettings: (channel: Channel) => void;
  /** 볼 시간 알림이 있으면 그 짧은 표기 (예: "매주 토 21:00"). */
  alertLabel?: string;
  /** 카드 배경색. 놓이는 바탕에 맞춰 대비를 조정할 때 덮어쓴다. */
  backgroundColor?: string;
  /** 새로 올라온 영상 수 (있으면 썸네일 위에 빨간 배지). */
  newCount?: number;
  /** 최신 영상 (최신순). 있으면 제목 아래에 가로로 보여 준다. */
  videos?: Video[];
  /** 이 시각 이후 게시된 영상에 NEW 표시. */
  newSince?: number;
  /** 소분류에 들어 있는 채널이면 제목 앞에 그 소분류 이름표를 단다 (대분류 '전체' 목록에서). */
  subLabel?: { name: string; color: string };
  compact?: boolean;
}

/**
 * 구독 채널 한 칸.
 * 썸네일·제목을 누르면 유튜브 채널이, 영상 썸네일을 누르면 그 영상이 열린다. '설정'으로 분류함 이동·알림을 정한다.
 */
export function ChannelCard({
  channel,
  category,
  onSettings,
  alertLabel,
  backgroundColor,
  newCount = 0,
  videos = [],
  newSince = Infinity,
  subLabel,
  compact,
}: ChannelCardProps) {
  const theme = useTheme();
  const accent = category?.color ?? theme.textSecondary;
  const detail =
    channel.description ||
    (channel.subscriberCount ? `구독자 ${formatCount(channel.subscriberCount)}` : '');

  const openChannel = () => {
    // 웹은 새 탭, 휴대폰은 유튜브 앱(없으면 브라우저)으로 열린다.
    Linking.openURL(channelUrl(channel)).catch(() => {});
  };

  // 모바일 / 좁은 화면: 상단에 채널 정보 + 우측 설정, 하단에 최신 영상 썸네일 스트립 전체 너비 배치
  if (compact) {
    return (
      <View style={[styles.cardCompact, { backgroundColor: backgroundColor ?? theme.backgroundElement }]}>
        <View style={styles.topRowCompact}>
          <Pressable
            onPress={openChannel}
            role="link"
            aria-label={`${channel.title} 유튜브 채널 열기`}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}>
            <Avatar
              title={channel.title}
              color={accent}
              thumbnail={channel.thumbnail}
              size={42}
            />
            {newCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{newCount > 9 ? '9+' : newCount}</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.infoCompact}>
            <Pressable
              onPress={openChannel}
              role="link"
              aria-label={`${channel.title} 유튜브 채널 열기`}
              style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}>
              {subLabel ? (
                <View style={[styles.subTag, { backgroundColor: subLabel.color }]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.subTagText, { color: readableText(subLabel.color) }]}>
                    └ {subLabel.name}
                  </Text>
                </View>
              ) : null}
              <Text numberOfLines={1} style={[styles.title, styles.titleCompact, { color: theme.text }]}>
                {channel.title}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={13} color={theme.textSecondary} />
            </Pressable>
            {detail ? (
              <Text numberOfLines={1} style={[styles.detail, { color: theme.textSecondary }]}>
                {detail}
              </Text>
            ) : null}
          </View>

          <View style={styles.sideCompact}>
            {alertLabel ? (
              <View style={[styles.alertChip, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialCommunityIcons name="bell-ring-outline" size={12} color={theme.text} />
              </View>
            ) : null}
            <Pressable
              onPress={() => onSettings(channel)}
              hitSlop={8}
              role="button"
              aria-label={`${channel.title} 설정`}
              style={({ pressed }) => [
                styles.settingsButton,
                { borderColor: accent, opacity: pressed ? 0.6 : 1, paddingVertical: 3, paddingHorizontal: 8 },
              ]}>
              <ThemedText type="small" style={{ color: accent, fontSize: 12 }}>
                설정
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {videos.length > 0 && (
          <View style={styles.videoStripCompact}>
            <VideoStrip videos={videos} newSince={newSince} compact={true} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: backgroundColor ?? theme.backgroundElement }]}>
      <Pressable
        onPress={openChannel}
        role="link"
        aria-label={`${channel.title} 유튜브 채널 열기`}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}>
        <Avatar
          title={channel.title}
          color={accent}
          thumbnail={channel.thumbnail}
          size={56}
        />
        {newCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newCount > 9 ? '9+' : newCount}</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.info}>
        <Pressable
          onPress={openChannel}
          role="link"
          aria-label={`${channel.title} 유튜브 채널 열기`}
          style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}>
          {subLabel ? (
            <View style={[styles.subTag, { backgroundColor: subLabel.color }]}>
              <Text
                numberOfLines={1}
                style={[styles.subTagText, { color: readableText(subLabel.color) }]}>
                └ {subLabel.name}
              </Text>
            </View>
          ) : null}
          <Text numberOfLines={1} style={styles.titleLine}>
            <Text style={[styles.title, { color: theme.text }]}>
              {channel.title}
            </Text>
            {detail ? (
              <Text style={[styles.detail, { color: theme.textSecondary }]}>
                {'   '}
                {detail}
              </Text>
            ) : null}
          </Text>
          <MaterialCommunityIcons name="open-in-new" size={14} color={theme.textSecondary} />
        </Pressable>

        {videos.length > 0 && <VideoStrip videos={videos} newSince={newSince} compact={false} />}
      </View>

      <View style={styles.side}>
        {alertLabel ? (
          <View style={[styles.alertChip, { backgroundColor: theme.backgroundSelected }]}>
            <MaterialCommunityIcons name="bell-ring-outline" size={13} color={theme.text} />
            <Text style={[styles.alertText, { color: theme.text }]}>{alertLabel}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => onSettings(channel)}
          hitSlop={8}
          role="button"
          aria-label={`${channel.title} 설정 (분류함 이동, 알림)`}
          style={({ pressed }) => [
            styles.settingsButton,
            { borderColor: accent, opacity: pressed ? 0.6 : 1 },
          ]}>
          <ThemedText type="small" style={{ color: accent }}>
            설정
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardCompact: {
    flexDirection: 'column',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  topRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCompact: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sideCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoStripCompact: {
    width: '100%',
    paddingTop: 4,
  },
  avatarButton: { cursor: 'pointer' },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#ff0033',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  titleLine: { flexShrink: 1 },
  subTag: {
    flexShrink: 0,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  subTagText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700' },
  titleCompact: { fontSize: 15 },
  detail: { fontSize: 13, fontWeight: '400' },
  side: { alignItems: 'flex-end', gap: 6 },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  alertText: { fontSize: 11, fontWeight: '600' },
  settingsButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
});
