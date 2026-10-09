import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CheckState } from '@/hooks/use-new-videos';
import { readableText } from '@/utils/color';

export interface PillItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface Props {
  /** 새 영상이 있는 분류함만 넘긴다. */
  items: PillItem[];
  state: CheckState;
  progress: { done: number; total: number } | null;
  /** 한 번이라도 확인한 적이 있는지 (없으면 '새 영상 없음' 대신 확인을 권한다). */
  checkedOnce: boolean;
  /** 알람 아이콘: 지금 확인하기 (로그인이 필요하면 로그인으로). */
  onAlarm: () => void;
  /** 숫자 원: 그 분류함 탭으로 이동. */
  onSelect: (key: string) => void;
}

/** 분류함별 새 영상 수를 보여주는 알람 표시줄 (⏰ + 분류함 색 숫자 원). */
export function NewVideoPill({ items, state, progress, checkedOnce, onAlarm, onSelect }: Props) {
  const dark = useColorScheme() === 'dark';
  const iconColor = dark ? '#f2f3f5' : '#111214';
  const hintColor = dark ? '#c9ccd2' : '#2f3237';

  let hint = '';
  if (state === 'checking') hint = progress ? `확인 중 ${progress.done}/${progress.total}` : '확인 중…';
  else if (state === 'needs-login') hint = '눌러서 YouTube 연결';
  else if (state === 'error') hint = '확인 실패';
  else if (items.length === 0) hint = checkedOnce ? '새 영상 없음' : '눌러서 확인';

  return (
    <View style={[styles.pill, { backgroundColor: dark ? '#3a3d44' : '#c4c6cb' }]}>
      <Pressable
        onPress={onAlarm}
        disabled={state === 'checking'}
        hitSlop={6}
        role="button"
        aria-label={state === 'needs-login' ? '로그인하고 새 영상 확인' : '새 영상 지금 확인'}
        style={({ pressed }) => [styles.alarm, pressed && styles.pressed]}>
        {state === 'checking' ? (
          <ActivityIndicator color={iconColor} />
        ) : (
          <MaterialCommunityIcons name="alarm" size={32} color={iconColor} />
        )}
      </Pressable>

      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={() => onSelect(it.key)}
          role="button"
          aria-label={`${it.label} 새 영상 ${it.count}개`}
          style={({ pressed }) => [styles.dot, { backgroundColor: it.color }, pressed && styles.pressed]}>
          <Text style={[styles.dotText, { color: readableText(it.color) }]}>
            {it.count > 99 ? '99+' : it.count}
          </Text>
        </Pressable>
      ))}

      {hint ? <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  alarm: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
