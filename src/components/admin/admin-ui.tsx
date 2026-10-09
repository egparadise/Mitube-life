import { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export const LINK = '#065fd4';

/** 각 화면 맨 위: 작은 제목 + 큰 제목 + 설명 + 오른쪽 그림. */
export function PageHeader({
  crumb,
  title,
  desc,
  art,
}: {
  crumb: string;
  title: string;
  desc?: ReactNode;
  art?: string;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
      <View style={{ flex: 1, gap: 10 }}>
        <Text style={[styles.crumb, { color: theme.text }]}>{crumb}</Text>
        <Text style={[styles.title, { color: theme.text }, width < 700 && { fontSize: 20 }]}>{title}</Text>
        {desc ? <Text style={[styles.desc, { color: theme.textSecondary }]}>{desc}</Text> : null}
      </View>
      {art && width >= 700 ? <Text style={styles.art}>{art}</Text> : null}
    </View>
  );
}

/** 구역 제목 (일반 · 언어 · 재생 …). */
export function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {desc ? <Text style={[styles.small, { color: theme.textSecondary }]}>{desc}</Text> : null}
    </View>
  );
}

/** 왼쪽 이름표 + 오른쪽 내용 한 줄. */
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 700;
  return (
    <View style={[styles.row, narrow && { flexDirection: 'column', gap: 10 }]}>
      <Text style={[styles.rowLabel, { color: theme.text }, narrow && { width: 'auto' }]}>{label}</Text>
      <View style={{ flex: 1, gap: 18 }}>{children}</View>
    </View>
  );
}

/** 스위치 + 제목 + 설명. */
export function ToggleItem({
  value,
  onChange,
  title,
  desc,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggle}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#c7c7cc', true: '#8fb4f5' }}
        thumbColor={value ? '#065fd4' : '#606060'}
        {...({ activeThumbColor: '#065fd4' } as object)}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
        {desc ? <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{desc}</Text> : null}
      </View>
    </Pressable>
  );
}

/** 라디오 버튼 목록. */
export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; desc?: string; disabled?: boolean }[];
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 14 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.radioRow, o.disabled && { opacity: 0.45 }]}>
            <View style={[styles.radio, { borderColor: on ? LINK : theme.text }]}>
              {on && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemDesc, { color: theme.text }]}>{o.label}</Text>
              {o.desc ? <Text style={[styles.small, { color: theme.textSecondary }]}>{o.desc}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 작은 알약 선택 (분 단위 등). */
export function Chips<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.chips, disabled && { opacity: 0.45 }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              { borderColor: on ? LINK : theme.backgroundSelected, backgroundColor: on ? '#e8f0fe' : 'transparent' },
            ]}>
            <Text style={{ color: on ? LINK : theme.text, fontWeight: on ? '700' : '500', fontSize: 13 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 파란 글자 링크 (+ 아래 설명). */
export function LinkItem({ label, url, onPress, desc }: { label: string; url?: string; onPress?: () => void; desc?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Pressable onPress={onPress ?? (() => url && Linking.openURL(url))}>
        <Text style={[styles.itemTitle, { color: LINK }]}>{label}</Text>
      </Pressable>
      {desc ? <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>{desc}</Text> : null}
    </View>
  );
}

/** 테두리 알약 버튼. */
export function OutlineButton({
  label,
  onPress,
  danger,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outline,
        { borderColor: primary ? LINK : theme.backgroundSelected, backgroundColor: primary ? LINK : 'transparent' },
        (pressed || disabled) && { opacity: 0.6 },
      ]}>
      <Text style={{ color: primary ? '#fff' : danger ? '#d93025' : LINK, fontWeight: '600', fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.backgroundSelected, marginVertical: 8 }} />;
}

export const adminStyles = StyleSheet.create({
  small: { fontSize: 12 },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottomWidth: 1, marginBottom: 8 },
  crumb: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 18 },
  desc: { fontSize: 14, lineHeight: 21 },
  art: { fontSize: 84 },
  section: { gap: 6, marginTop: 28, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  small: { fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', paddingVertical: 18, gap: 16 },
  rowLabel: { width: 180, fontSize: 14, fontWeight: '700', paddingTop: 2 },
  toggle: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 14, lineHeight: 20 },
  radioRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: LINK },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  outline: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'flex-start' },
});
