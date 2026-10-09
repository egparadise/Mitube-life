import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface Props {
  children: ReactNode;
  /** 양 끝 흐림·화살표 뒤 바탕색. 이 줄이 놓인 바탕과 같은 색(#rrggbb)을 준다. */
  fadeColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** 화살표 버튼을 읽어 줄 때 쓰는 이름 (예: '아이콘'). */
  label?: string;
  /** 처음 열릴 때 이 위치(내용 기준 x, 보통 선택된 항목의 가운데)가 가운데 오도록 한 번 넘겨 둔다. */
  initialCenterX?: number;
}

/**
 * 가로로 넘치는 줄. 넘친 쪽 끝에 ‹ › 버튼이 생기고, 웹에서는 마우스 휠로도 넘긴다.
 * 휴대폰에서 손가락으로 끌어 넘기는 기본 동작은 그대로다.
 */
export function HScroller({
  children,
  fadeColor,
  contentContainerStyle,
  label = '항목',
  initialCenterX,
}: Props) {
  const theme = useTheme();
  const bg = fadeColor ?? theme.background;
  const clear = /^#[0-9a-f]{6}$/i.test(bg) ? `${bg}00` : 'transparent';

  const scrollRef = useRef<ScrollView>(null);
  const [x, setX] = useState(0);
  const [viewWidth, setViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // 웹: 세로 휠을 가로로 바꿔 준다. 더 넘길 곳이 없으면 바깥(세로) 스크롤이 이어받는다.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = scrollRef.current?.getScrollableNode() as HTMLElement | undefined;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // Ctrl+휠(확대·축소)은 브라우저에 맡긴다
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const before = node.scrollLeft;
      node.scrollLeft += e.deltaY;
      if (node.scrollLeft !== before) e.preventDefault();
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const maxX = Math.max(0, contentWidth - viewWidth);

  // 선택된 항목이 화면 밖에 있으면, 처음 크기가 정해졌을 때 한 번만 그쪽으로 넘겨 둔다.
  const initialApplied = useRef(false);
  useEffect(() => {
    if (initialApplied.current || initialCenterX == null || !viewWidth || !contentWidth) return;
    initialApplied.current = true;
    const target = Math.min(maxX, Math.max(0, initialCenterX - viewWidth / 2));
    if (target <= 0) return;
    scrollRef.current?.scrollTo({ x: target, animated: false });
    setX(target);
  }, [initialCenterX, viewWidth, contentWidth, maxX]);
  const canLeft = x > 2;
  const canRight = x < maxX - 2;

  const page = (dir: 1 | -1) => {
    const next = Math.min(maxX, Math.max(0, x + dir * Math.max(120, viewWidth * 0.8)));
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  // 흐림(그라데이션)은 터치를 받지 않는 배경 층으로 두고, 가운데 버튼만 눌리게 한다.
  // (안드로이드의 LinearGradient 는 안쪽에 터치를 받는 네이티브 층이 따로 있어 box-none 만으로는 안 된다.)
  const arrow = (side: 'left' | 'right') => (
    <View style={[styles.edge, side === 'left' ? styles.edgeLeft : styles.edgeRight]}>
      <LinearGradient
        colors={side === 'left' ? [bg, bg, clear] : [clear, bg, bg]}
        locations={side === 'left' ? [0, 0.55, 1] : [0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, styles.noTouch]}
      />
      <Pressable
        onPress={() => page(side === 'left' ? -1 : 1)}
        hitSlop={6}
        role="button"
        aria-label={side === 'left' ? `이전 ${label} 보기` : `다음 ${label} 보기`}
        style={({ pressed }) => [
          styles.arrow,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
            opacity: pressed ? 0.6 : 1,
          },
        ]}>
        <MaterialCommunityIcons
          name={side === 'left' ? 'chevron-left' : 'chevron-right'}
          size={22}
          color={theme.text}
        />
      </Pressable>
    </View>
  );

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        // 바깥 목록이 iOS 상태바 탭(맨 위로)을 받도록 이 가로 스크롤은 빠진다.
        scrollsToTop={false}
        style={styles.scroller}
        contentContainerStyle={contentContainerStyle}
        onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={(e) => setX(e.nativeEvent.contentOffset.x)}
        // 휴대폰은 스크롤 중 이벤트를 솎아 내 마지막 위치를 놓칠 수 있어, 멈춘 뒤의 위치로 한 번 더 맞춘다.
        onScrollEndDrag={(e) => setX(e.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={(e) => setX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={32}>
        {children}
      </ScrollView>
      {canLeft && arrow('left')}
      {canRight && arrow('right')}
    </View>
  );
}

const styles = StyleSheet.create({
  // 가로 ScrollView 는 기본이 flexGrow:1 이라 세로로 늘어날 수 있다 → 내용 높이에 고정.
  scroller: { flexGrow: 0, flexShrink: 0 },
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 56,
    justifyContent: 'center',
    // 흐림 부분은 눌림을 막지 않고, 가운데 버튼만 눌린다.
    pointerEvents: 'box-none',
  },
  noTouch: { pointerEvents: 'none' },
  edgeLeft: { left: 0, alignItems: 'flex-start' },
  edgeRight: { right: 0, alignItems: 'flex-end' },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
  },
});
