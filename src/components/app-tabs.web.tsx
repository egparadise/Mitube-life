import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Image } from 'expo-image';
import { Pressable, View, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { ThemedView } from './themed-view';

import { ChannelSearch } from '@/components/channel-search';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store/store';

const PINK = '#ff9fd8';
const PINK_EDGE = '#e27dbd';
const NAVY = '#1b2c9e';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton edge="left">홈</TabButton>
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <TabButton edge="middle">구독</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton edge="right">설정</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

/**
 * 분홍 테두리 알약 모양 스위치의 한 칸.
 * 선택된 칸은 볼록한 분홍 키(남색 굵은 글씨), 안 된 칸은 연회색 글씨.
 */
export function TabButton({
  children,
  isFocused,
  edge: _edge,
  ...props
}: TabTriggerSlotProps & { edge: 'left' | 'middle' | 'right' }) {
  const dark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 540;

  return (
    <Pressable
      {...props}
      role="tab"
      aria-selected={!!isFocused}
      style={({ pressed }) => [
        styles.slot,
        pressed && !isFocused && styles.pressed,
      ]}>
      {isFocused ? (
        <View style={styles.key}>
          <Text style={[styles.keyText, isMobile && { fontSize: 13 }]}>{children}</Text>
        </View>
      ) : (
        <Text
          style={[
            styles.idleText,
            { color: dark ? '#6b6f78' : '#b9b9be' },
            isMobile && { fontSize: 13, paddingHorizontal: 6 },
          ]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const dark = useColorScheme() === 'dark';
  const openLanding = useStore((s) => s.openLanding);
  const { width } = useWindowDimensions();
  const isMobile = width < 540;
  const isSmall = width < 420;
  const isTiny = width < 360;

  return (
    <View {...props} style={[styles.tabListContainer, isMobile && { padding: 8 }]}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.innerContainer,
          isMobile && { paddingHorizontal: 8, paddingVertical: 5, gap: 6 },
        ]}>
        <Pressable
          onPress={() => openLanding('home')}
          role="button"
          aria-label="마이 튜브 소개 페이지로 이동"
          style={({ pressed }) => [styles.brandButton, pressed && styles.brandButtonPressed]}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/mascot.webp')}
              style={[styles.brandMascot, (isSmall || isTiny) && { width: 22, height: 22 }]}
              contentFit="contain"
            />
            {/* 좁은 화면에서는 검색창 자리를 위해 글자 로고를 숨긴다 */}
            {!isMobile && (
              <Image
                source={require('@/assets/images/brand-logo.png')}
                style={styles.brandLogo}
                contentFit="contain"
                accessibilityLabel="마이 튜브"
              />
            )}
          </View>
        </Pressable>

        <ChannelSearch compact={isMobile} />

        <View
          role="tablist"
          style={[
            styles.track,
            { backgroundColor: dark ? '#2a2c31' : '#e9e9ec' },
            { width: isTiny ? 150 : isSmall ? 175 : isMobile ? 200 : 310 },
            isMobile && { height: 38 },
          ]}>
          {props.children}
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandButton: {
    cursor: 'pointer',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  brandButtonPressed: {
    opacity: 0.65,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandMascot: { width: 26, height: 26 },
  brandLogo: { width: 75, height: 30 },
  // 분홍 테두리 알약 트랙 (안쪽은 살짝 들어간 회색)
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 310,
    height: 44,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: PINK,
    padding: 2,
    overflow: 'hidden',
    boxShadow: '0 0 0 3px rgba(255, 159, 216, 0.28), inset 0 2px 5px rgba(0, 0, 0, 0.12)',
  },
  slot: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  // 선택된 칸: 트랙 안쪽에 꼭 맞는 볼록한 분홍 알약 키
  key: {
    height: '100%',
    width: '100%',
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 2px 0 ${PINK_EDGE}, 0 4px 8px rgba(0, 0, 0, 0.15)`,
  },
  keyText: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '800',
  },
  idleText: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
