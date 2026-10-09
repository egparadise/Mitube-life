import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** 'Google로 계속하기' 버튼 (흰 바탕 + 테두리, 구글 버튼 표준 형태). 처음이면 자동 가입, 아니면 로그인. */
export function RedirectGoogleButton({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      role="button"
      aria-label="Google 계정으로 가입 또는 로그인"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
      ]}>
      {busy ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <>
          <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
          <Text style={[styles.text, { color: theme.text }]}>Google로 가입 · 로그인</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  text: { fontSize: 16, fontWeight: '700' },
});
