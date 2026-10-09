import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { mix, readableText } from '@/utils/color';

export interface TabItem {
  key: string;
  label: string;
  color: string;
  /** 탭 이름 옆에 보여 줄 채널 수 (없으면 표시 안 함). */
  count?: number;
}

interface Props {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** 선 오른쪽 끝 검은 '추가' — 설정 화면의 분류함 '+ 추가'와 같은 동작(최상위 분류함). */
  onAdd: () => void;
  /** 선택한 상위 탭의 하위 분류함들. */
  subTabs?: TabItem[];
  /** 선택한 하위 탭 (null 이면 상위 전체). */
  activeSubKey?: string | null;
  /** 같은 하위 탭을 다시 누르면 null(전체)로 돌아간다. */
  onSelectSub?: (key: string | null) => void;
  /** 하위 줄의 보라 '추가'. 없으면 하위 줄을 그리지 않는다 (미분류 탭 등). */
  onAddSub?: () => void;
}

/** 탭 아래 기준선 그라데이션 (보라 → 분홍 → 주황). */
const BASELINE = ['#9b5cf6', '#d2609f', '#f59a57'] as const;
const SUB_ADD_COLOR = '#7c3aed';
/** 검은 '추가'(40px)를 선 위에 가운데 맞추려고 선 위쪽에 두는 여백. */
const LINE_TOP = 17;

/**
 * 분류함을 큰 폴더 탭으로, 그 아래 선에 매달린 작은 탭으로 하위 분류함을 보여준다.
 * 탭은 화면 폭을 채우도록 늘어나고, 다 안 들어가면 가로로 스크롤된다.
 * 뒤쪽 탭이 앞쪽 탭 끝을 살짝 덮고, 선택한 탭은 더 솟아(하위는 더 늘어져) 맨 앞에 온다.
 */
export function CategoryTabs({
  tabs,
  activeKey,
  onSelect,
  onAdd,
  subTabs = [],
  activeSubKey = null,
  onSelectSub,
  onAddSub,
}: Props) {
  const dark = useColorScheme() === 'dark';
  const compact = useWindowDimensions().width < 700;
  const overlap = compact ? 14 : 22;
  const sidePad = compact ? 16 : 24;
  const idle = (color: string) => (dark ? mix(color, '#000000', 0.25) : mix(color, '#ffffff', 0.18));

  const scrollRef = useRef<ScrollView>(null);
  const tabPos = useRef(new Map<string, { x: number; w: number }>());
  const [viewWidth, setViewWidth] = useState(0);

  // 웹: 마우스 세로 휠로도 탭 줄을 가로로 넘길 수 있게 한다 (가로 스크롤바는 숨겨져 있음).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = scrollRef.current?.getScrollableNode() as HTMLElement | undefined;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (node.scrollWidth <= node.clientWidth) return; // 넘칠 때만 가로채기
      node.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  // 선택한 탭이 가려져 있으면 보이는 곳(가운데쯤)으로 스크롤한다.
  useEffect(() => {
    const pos = tabPos.current.get(activeKey);
    if (!pos || !viewWidth) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, pos.x - (viewWidth - pos.w) / 2), animated: true });
  }, [activeKey, viewWidth]);

  return (
    <View>
      {/* 상위 분류함 탭 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        // iOS 상태바 탭 → 맨 위로 스크롤은 채널 목록이 받도록 이 가로 스크롤은 빠진다.
        scrollsToTop={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
        onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
        role="tablist">
        {tabs.map((tab, i) => {
          const active = tab.key === activeKey;
          const bg = active ? tab.color : idle(tab.color);
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              onLayout={(e) =>
                tabPos.current.set(tab.key, { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width })
              }
              role="tab"
              aria-selected={active}
              aria-label={tab.count != null ? `${tab.label} ${tab.count}개` : tab.label}
              style={({ pressed }) => [
                styles.tab,
                compact ? styles.tabCompact : styles.tabWide,
                active && (compact ? styles.raisedCompact : styles.raisedWide),
                active ? styles.shadowActive : styles.shadow,
                {
                  backgroundColor: bg,
                  minWidth: compact ? 104 : 150,
                  marginLeft: i === 0 ? 0 : -overlap,
                  paddingLeft: sidePad,
                  // 오른쪽은 다음 탭에 덮이는 만큼 더 비워 글자가 가운데 보이게 한다.
                  paddingRight: sidePad + (i === tabs.length - 1 ? 0 : overlap),
                  zIndex: active ? tabs.length + 1 : i + 1,
                },
                pressed && !active && styles.pressed,
              ]}>
              <Text
                numberOfLines={1}
                style={[styles.label, compact ? styles.labelCompact : styles.labelWide, { color: readableText(bg) }]}>
                {tab.label}
              </Text>
              {tab.count != null && (
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: readableText(bg) === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)' },
                  ]}>
                  <Text
                    style={[styles.countText, compact && styles.countTextCompact, { color: readableText(bg) }]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 기준선 + (선에 매달린) 하위 분류함 탭 + 검은 '추가' */}
      <View style={styles.lineBlock}>
        <LinearGradient colors={BASELINE} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.baseline} />

        {onAddSub && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollsToTop={false}
            style={styles.scroller}
            contentContainerStyle={styles.subRow}
            role="tablist"
            aria-label="하위 분류함">
            {subTabs.map((sub, i) => {
              const active = sub.key === activeSubKey;
              const bg = active ? sub.color : idle(sub.color);
              return (
                <Pressable
                  key={sub.key}
                  onPress={() => onSelectSub?.(active ? null : sub.key)}
                  role="tab"
                  aria-selected={active}
                  aria-label={`하위 분류함 ${sub.label}`}
                  style={({ pressed }) => [
                    styles.sub,
                    compact ? styles.subCompact : styles.subWide,
                    active && (compact ? styles.subDroppedCompact : styles.subDroppedWide),
                    active ? styles.subShadowActive : styles.subShadow,
                    {
                      backgroundColor: bg,
                      marginLeft: i === 0 ? 0 : -12,
                      paddingRight: (compact ? 14 : 20) + (i === subTabs.length - 1 ? 0 : 12),
                      zIndex: active ? subTabs.length + 1 : i + 1,
                    },
                    pressed && !active && styles.pressed,
                  ]}>
                  <Text numberOfLines={1} style={[styles.subLabel, { color: readableText(bg) }]}>
                    {sub.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={onAddSub}
              role="button"
              aria-label="하위 분류함 추가"
              style={({ pressed }) => [styles.subAdd, pressed && styles.pressed]}>
              <Text style={styles.subAddText}>추가</Text>
            </Pressable>
            {subTabs.length === 0 && <Text style={[styles.subHint, { color: dark ? '#b0b4ba' : '#60646c' }]}>하위 분류함 만들기</Text>}
          </ScrollView>
        )}

        <Pressable
          onPress={onAdd}
          role="button"
          aria-label="분류함 추가"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: dark ? '#f2f3f5' : '#000000' },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.addText, { color: dark ? '#000000' : '#ffffff' }]}>추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 가로 ScrollView 는 기본이 flexGrow:1 이라 세로로 늘어나 탭이 아래로 밀린다 → 내용 높이에 고정.
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
  // flexGrow:1 → 탭이 적으면 화면 폭을 채우도록 늘어난다.
  row: {
    flexGrow: 1,
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  tab: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabWide: { paddingVertical: 20 },
  tabCompact: { paddingVertical: 12 },
  raisedWide: { paddingTop: 27 },
  raisedCompact: { paddingTop: 17 },
  shadow: { boxShadow: '4px 0px 6px rgba(0, 0, 0, 0.22)' },
  shadowActive: { boxShadow: '4px -3px 10px rgba(0, 0, 0, 0.28)' },
  pressed: { opacity: 0.8 },
  label: { fontWeight: '600' },
  labelWide: { fontSize: 22 },
  labelCompact: { fontSize: 16 },
  countPill: {
    minWidth: 30,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
  },
  countText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  countTextCompact: { fontSize: 12 },

  lineBlock: {
    paddingTop: LINE_TOP,
    minHeight: LINE_TOP + 23,
  },
  baseline: {
    height: 6,
    borderRadius: 3,
    marginRight: 20,
  },
  addButton: {
    position: 'absolute',
    top: LINE_TOP + 3 - 20,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // 하위 분류함: 선에 매달린 작은 탭 (아래 모서리가 둥글다)
  subRow: {
    alignItems: 'flex-start',
    paddingRight: 52, // 오른쪽 끝 검은 '추가'와 겹치지 않게
    paddingBottom: 6,
  },
  sub: {
    flexShrink: 0,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  subWide: { paddingLeft: 20, paddingVertical: 8 },
  subCompact: { paddingLeft: 14, paddingVertical: 6 },
  subDroppedWide: { paddingBottom: 13 },
  subDroppedCompact: { paddingBottom: 10 },
  subShadow: { boxShadow: '3px 2px 4px rgba(0, 0, 0, 0.18)' },
  subShadowActive: { boxShadow: '3px 4px 8px rgba(0, 0, 0, 0.26)' },
  subLabel: { fontSize: 15, fontWeight: '600' },
  subAdd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 6,
    marginTop: 2,
    backgroundColor: SUB_ADD_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subAddText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  subHint: { alignSelf: 'center', marginLeft: 8, fontSize: 12, fontWeight: '600' },
});
