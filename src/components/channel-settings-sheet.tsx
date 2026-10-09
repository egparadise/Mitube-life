import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HScroller } from '@/components/h-scroller';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { syncAlertsFromStore } from '@/hooks/use-alerts';
import { useTheme } from '@/hooks/use-theme';
import { ALERTS_RUN_IN_APP, ensureAlertPermission } from '@/services/alerts';
import { useStore } from '@/store/store';
import { AlertFreq, Category, Channel, ChannelAlert } from '@/types';
import { alertMonthDays, alertWeekdays, describeAlert, formatClock, WEEKDAY_NAMES } from '@/utils/alert-time';
import { mix, readableText } from '@/utils/color';

type FreqChoice = 'off' | AlertFreq;

const FREQS: { key: FreqChoice; label: string }[] = [
  { key: 'off', label: '끄기' },
  { key: 'daily', label: '매일' },
  { key: 'weekly', label: '매주' },
  { key: 'monthly', label: '매달' },
];
const PRESETS: [number, number][] = [
  [7, 0],
  [12, 0],
  [18, 0],
  [21, 0],
  [23, 0],
];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
const DEFAULT_ALERT: ChannelAlert = {
  freq: 'daily',
  hour: 21,
  minute: 0,
  weekday: 7,
  monthDay: 1,
};
const ACCENT = '#ff0033';

interface Props {
  /** null 이면 닫힌 상태. */
  channel: Channel | null;
  categories: Category[];
  onClose: () => void;
}

/** 채널 '설정' 시트: ① 분류함 이동 ② 볼 시간 알림 (매일·매주·매달, 24시간제). */
export function ChannelSettingsSheet({ channel, categories, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const visible = channel !== null;
  const channelId = channel?.id ?? '';

  // 이동하면 분류가 바뀌므로 저장소의 최신 값을 읽는다.
  const currentCategoryId = useStore(
    (s) => s.channels.find((c) => c.id === channelId)?.categoryId ?? null,
  );
  const savedAlert = useStore((s) => (channelId ? s.channelAlerts[channelId] : undefined));
  const moveChannel = useStore((s) => s.moveChannel);
  const setChannelAlert = useStore((s) => s.setChannelAlert);

  const [freq, setFreq] = useState<FreqChoice>('off');
  const [draft, setDraft] = useState<ChannelAlert>(DEFAULT_ALERT);
  const [note, setNote] = useState('');

  // 시트가 열릴 때(또는 다른 채널로 바뀔 때) 저장된 값으로 채운다.
  useEffect(() => {
    if (!visible) return;
    setFreq(savedAlert?.freq ?? 'off');
    setDraft(savedAlert ?? DEFAULT_ALERT);
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, channelId]);

  // 상위 분류함마다 그 아래 하위 분류함을 묶는다. 하위가 있는 상위는 한 줄을 통째로 쓰는 묶음 상자로 보여 준다.
  const byOrder = (x: Category, y: Category) => x.order - y.order;
  const groups = categories
    .filter((c) => !c.parentId)
    .sort(byOrder)
    .map((top) => ({
      top,
      subs: categories.filter((c) => c.parentId === top.id).sort(byOrder),
    }));
  const current = currentCategoryId
    ? categories.find((c) => c.id === currentCategoryId)
    : undefined;
  const currentParent = current?.parentId
    ? categories.find((c) => c.id === current.parentId)
    : undefined;
  const currentLabel = current
    ? currentParent
      ? `${currentParent.name} › ${current.name}`
      : current.name
    : '미분류';

  const move = (id: string | null, label: string) => {
    if (!channel || id === currentCategoryId) return;
    moveChannel(channel.id, id);
    setNote(`'${label}' 분류함으로 옮겼어요`);
  };

  // 요일·날짜는 여러 개 고를 수 있다 (눌러서 켜고 끄기, 마지막 하나는 남긴다).
  const days = alertWeekdays(draft);
  const mdays = alertMonthDays(draft);
  const toggleWeekday = (w: number) =>
    setDraft((d) => {
      const cur = alertWeekdays(d);
      const next = cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w].sort((x, y) => x - y);
      if (next.length === 0) return d;
      return { ...d, weekdays: next, weekday: next[0] };
    });
  const toggleMonthDay = (md: number) =>
    setDraft((d) => {
      const cur = alertMonthDays(d);
      const next = cur.includes(md) ? cur.filter((x) => x !== md) : [...cur, md].sort((x, y) => x - y);
      if (next.length === 0) return d;
      return { ...d, monthDays: next, monthDay: next[0] };
    });

  const step = (field: 'hour' | 'minute', delta: number) =>
    setDraft((d) => {
      const mod = field === 'hour' ? 24 : 60;
      return { ...d, [field]: (d[field] + delta + mod) % mod };
    });

  const save = () => {
    if (!channel) return;
    if (freq === 'off') {
      setChannelAlert(channel.id, null);
      onClose(); // 저장되면 창을 닫는다
      return;
    }
    const alert: ChannelAlert = { ...draft, freq };
    // 권한 창에 답하지 않아도 설정은 바로 저장하고, 저장되면 창을 닫는다.
    setChannelAlert(channel.id, alert);
    onClose();
    ensureAlertPermission()
      .then((granted) => {
        if (granted) {
          // 휴대폰: 저장 순간엔 권한이 없어 예약이 안 걸렸을 수 있으니 다시 건다.
          if (!ALERTS_RUN_IN_APP) syncAlertsFromStore().catch(() => {});
        } else if (ALERTS_RUN_IN_APP) {
          setNote(
            `저장했어요 · ${describeAlert(alert)} — 브라우저 알림이 꺼져 있어 화면 안 배너로만 알려드려요`,
          );
        } else {
          setNote('저장했지만 알림 권한이 없어요. 휴대폰 설정에서 이 앱의 알림을 허용해 주세요.');
        }
      })
      .catch(() => {});
  };

  const chip = (selected: boolean, color: string = ACCENT) => [
    styles.chip,
    {
      backgroundColor: selected ? color : theme.backgroundElement,
      borderColor: selected ? color : theme.backgroundSelected,
    },
  ];
  const chipText = (selected: boolean, color: string = ACCENT) => [
    styles.chipText,
    { color: selected ? readableText(color) : theme.text },
  ];

  /** 이동 버튼 하나. small 은 하위 분류함용 (조금 작게). */
  const moveChip = (
    id: string | null,
    name: string,
    fullLabel: string,
    color: string,
    small = false,
  ) => {
    const selected = id === currentCategoryId;
    return (
      <Pressable
        key={id ?? 'none'}
        onPress={() => move(id, fullLabel)}
        role="button"
        aria-label={`${fullLabel}${selected ? ' (현재 위치)' : ' 분류함으로 이동'}`}
        style={[chip(selected, color), small && styles.subChip]}>
        {!selected && (
          <View style={[styles.dot, small && styles.subDot, { backgroundColor: color }]} />
        )}
        <Text style={[chipText(selected, color), small && styles.subChipText]}>
          {name}
          {selected ? ' · 현재' : ''}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + Spacing.three,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="small" themeColor="textSecondary">
                채널 설정
              </ThemedText>
              <ThemedText style={styles.title} numberOfLines={1}>
                {channel?.title}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={10} role="button" aria-label="닫기">
              <ThemedText type="default" style={{ color: ACCENT }}>
                닫기
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* ① 분류함 이동 */}
            <ThemedText type="smallBold">1. 분류함 이동</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              지금 위치 ·{' '}
              <Text style={[styles.currentPath, { color: theme.text }]}>{currentLabel}</Text>
              {'  '}— 대분류나 그 아래 소분류(└)를 눌러 옮겨요
            </ThemedText>
            <View style={styles.wrap}>
              {groups.map(({ top, subs }) =>
                subs.length === 0 ? (
                  moveChip(top.id, top.name, top.name, top.color)
                ) : (
                  // 소분류가 있는 대분류: 한 줄을 차지하는 상자 안에 대분류 + 소분류를 함께 둔다.
                  <View
                    key={top.id}
                    style={[
                      styles.group,
                      {
                        borderColor: mix(top.color, theme.background, 0.55),
                        backgroundColor: mix(top.color, theme.background, 0.9),
                      },
                    ]}>
                    {moveChip(top.id, top.name, top.name, top.color)}
                    <View style={styles.subRow}>
                      <Text style={[styles.branch, { color: theme.textSecondary }]}>└</Text>
                      {subs.map((sub) =>
                        moveChip(sub.id, sub.name, `${top.name} › ${sub.name}`, sub.color, true),
                      )}
                    </View>
                  </View>
                ),
              )}
              {moveChip(null, '미분류', '미분류', theme.textSecondary)}
            </View>

            {/* ② 알림 설정 */}
            <View style={styles.sectionGap} />
            <ThemedText type="smallBold">2. 알림 설정 · 내가 볼 시간</ThemedText>
            <View style={styles.segment}>
              {FREQS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFreq(f.key)}
                  role="button"
                  aria-label={f.label}
                  style={[styles.segmentItem, chip(freq === f.key)]}>
                  <Text style={chipText(freq === f.key)}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {freq === 'weekly' && (
              <View style={styles.wrap}>
                {WEEKDAY_NAMES.map((name, i) => (
                  <Pressable
                    key={name}
                    onPress={() => toggleWeekday(i + 1)}
                    role="checkbox"
                    aria-checked={days.includes(i + 1)}
                    aria-label={`${name}요일`}
                    style={[styles.dayChip, chip(days.includes(i + 1))]}>
                    <Text style={chipText(days.includes(i + 1))}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {freq === 'monthly' && (
              <HScroller
                label="날짜"
                contentContainerStyle={styles.row}
                // 저장된 날짜가 보이도록 (칩 약 42 + 간격 8)
                initialCenterX={(mdays[0] - 1) * 50 + 21}>
                {MONTH_DAYS.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => toggleMonthDay(day)}
                    role="checkbox"
                    aria-checked={mdays.includes(day)}
                    aria-label={`${day}일`}
                    style={[styles.dayChip, chip(mdays.includes(day))]}>
                    <Text style={chipText(mdays.includes(day))}>{day}</Text>
                  </Pressable>
                ))}
              </HScroller>
            )}

            {freq !== 'off' && (
              <>
                <View style={styles.clockRow}>
                  <Stepper
                    label="시"
                    value={draft.hour}
                    onMinus={() => step('hour', -1)}
                    onPlus={() => step('hour', 1)}
                  />
                  <ThemedText style={styles.colon}>:</ThemedText>
                  <Stepper
                    label="분"
                    value={draft.minute}
                    onMinus={() => step('minute', -5)}
                    onPlus={() => step('minute', 5)}
                  />
                </View>
                <View style={styles.wrap}>
                  {PRESETS.map(([h, m]) => {
                    const selected = draft.hour === h && draft.minute === m;
                    return (
                      <Pressable
                        key={`${h}:${m}`}
                        onPress={() => setDraft((d) => ({ ...d, hour: h, minute: m }))}
                        role="button"
                        aria-label={formatClock(h, m)}
                        style={chip(selected)}>
                        <Text style={chipText(selected)}>{formatClock(h, m)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <ThemedText type="smallBold" style={styles.summary}>
                  🔔 {describeAlert({ ...draft, freq })}에 알려드려요
                </ThemedText>
              </>
            )}

            <PrimaryButton
              label={freq === 'off' ? (savedAlert ? '알림 끄기' : '저장') : '알림 저장'}
              onPress={save}
              style={styles.save}
            />
            {note ? (
              <ThemedText type="small" style={styles.note}>
                {note}
              </ThemedText>
            ) : null}
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              {ALERTS_RUN_IN_APP
                ? '웹에서는 이 페이지가 열려 있을 때 정해진 시각에 브라우저 알림과 화면 배너로 알려드려요. 휴대폰 앱에서는 앱이 꺼져 있어도 알림이 와요.'
                : '앱이 꺼져 있어도 정해진 시각에 휴대폰 알림이 와요.'}
            </ThemedText>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const theme = useTheme();
  const btn = [styles.stepBtn, { backgroundColor: theme.backgroundElement }];
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} role="button" aria-label={`${label} 줄이기`} style={btn}>
        <Text style={[styles.stepSign, { color: theme.text }]}>−</Text>
      </Pressable>
      <View style={styles.stepValueBox}>
        <Text style={[styles.stepValue, { color: theme.text }]}>
          {String(value).padStart(2, '0')}
        </Text>
        <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Pressable onPress={onPlus} role="button" aria-label={`${label} 늘리기`} style={btn}>
        <Text style={[styles.stepSign, { color: theme.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9993',
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  body: { gap: Spacing.two, paddingBottom: Spacing.two },
  sectionGap: { height: Spacing.three },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  currentPath: { fontWeight: '700' },
  group: {
    width: '100%',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
  },
  branch: { fontSize: 16, fontWeight: '700', marginRight: 2 },
  subChip: { paddingVertical: 5, paddingHorizontal: 10 },
  subChipText: { fontSize: 13 },
  subDot: { width: 8, height: 8, borderRadius: 4 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: { flex: 1, justifyContent: 'center' },
  dayChip: { minWidth: 42, justifyContent: 'center' },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.two,
  },
  colon: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontSize: 22, fontWeight: '700' },
  stepValueBox: { alignItems: 'center', minWidth: 52 },
  stepValue: { fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stepLabel: { fontSize: 11 },
  summary: { textAlign: 'center', marginTop: Spacing.one },
  save: { marginTop: Spacing.three },
  note: { textAlign: 'center', color: '#0b8a4b', marginTop: Spacing.one },
  hint: { lineHeight: 19, marginTop: Spacing.two },
});
