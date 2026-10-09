import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/components/auth-provider';
import { FormField } from '@/components/landing/form-field';
import { GoogleButton } from '@/components/landing/google-button';
import { useTheme } from '@/hooks/use-theme';
import { authErrorMessage, signIn, signInWithGoogle } from '@/services/auth';
import { NotConfiguredError } from '@/services/supabase';

const RED = '#ff0033';

interface Props {
  onDone: () => void;
  onBack: () => void;
  onGoSignup: () => void;
}

/** 로그인: 아이디·이메일·휴대폰 번호 중 하나 + 비밀번호, 또는 구글 계정. */
export function LoginForm({ onDone, onBack, onGoSignup }: Props) {
  const theme = useTheme();
  const { configured } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<null | 'password' | 'google'>(null);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!identifier.trim() || !password) {
      setError('아이디(이메일·휴대폰)와 비밀번호를 입력해 주세요.');
      return;
    }
    if (!configured) {
      setError(new NotConfiguredError().message);
      return;
    }
    setBusy('password');
    try {
      await signIn(identifier, password);
      onDone();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError('');
    if (!configured) {
      setError(new NotConfiguredError().message);
      return;
    }
    setBusy('google');
    try {
      await signInWithGoogle(); // 구글 화면으로 이동했다가 돌아오면 자동으로 로그인된다.
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(null);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>로그인</Text>
      {!configured && (
        <Text style={styles.notice}>
          지금은 서버(Supabase) 연결 설정 전이라 화면만 미리 볼 수 있어요.
        </Text>
      )}

      <FormField
        label="아이디 · 이메일 · 휴대폰 번호"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="mytube01 또는 name@example.com 또는 010-1234-5678"
        autoCapitalize="none"
      />
      <FormField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        placeholder="비밀번호"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={submit}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy !== null}
        role="button"
        aria-label="로그인"
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        {busy === 'password' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>로그인</Text>}
      </Pressable>

      <View style={styles.orRow}>
        <View style={[styles.orLine, { backgroundColor: theme.backgroundSelected }]} />
        <Text style={[styles.orText, { color: theme.textSecondary }]}>또는</Text>
        <View style={[styles.orLine, { backgroundColor: theme.backgroundSelected }]} />
      </View>
      <GoogleButton onPress={google} busy={busy === 'google'} />
      <Text style={[styles.orText, { color: theme.textSecondary, textAlign: 'center' }]}>
        처음이면 Google 계정으로 바로 가입되고, 다음부터는 같은 버튼으로 로그인돼요.
      </Text>

      <View style={styles.footerRow}>
        <Pressable onPress={onBack} role="button" aria-label="뒤로">
          <Text style={[styles.link, { color: theme.textSecondary }]}>← 뒤로</Text>
        </Pressable>
        <Pressable onPress={onGoSignup} role="button" aria-label="회원가입하기">
          <Text style={[styles.link, { color: theme.text }]}>
            처음이신가요? <Text style={{ color: RED, fontWeight: '800' }}>회원가입</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  notice: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8a5a00',
    backgroundColor: '#fff4dc',
    padding: 12,
    borderRadius: 10,
  },
  error: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  primary: { backgroundColor: RED, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontSize: 14 },
});
