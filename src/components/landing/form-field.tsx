import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface Props extends TextInputProps {
  label: string;
  /** 빨간 오류 문구 */
  error?: string | null;
  /** 초록 안내 문구 (예: 사용 가능한 아이디) */
  ok?: string | null;
  /** 입력칸 오른쪽에 붙는 버튼 등 */
  right?: ReactNode;
  required?: boolean;
}

/** 이름표 + 입력칸 + 오른쪽 버튼 + 오류/확인 문구. */
export function FormField({ label, error, ok, right, required, style, ...input }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          {...input}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: error ? '#ef4444' : 'transparent',
            },
            style,
          ]}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : ok ? <Text style={styles.ok}>{ok}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  required: { color: '#ff0033' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  error: { color: '#ef4444', fontSize: 13 },
  ok: { color: '#0b8a4b', fontSize: 13 },
});
