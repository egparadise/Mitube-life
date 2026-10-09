import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/store';

/** 관리자 2차 로그인이 유지되는 시간. 지나면(또는 새로고침하면) 다시 입력한다. */
export const ADMIN_SESSION_MS = 30 * 60 * 1000;
const MAX_TRIES = 5;
const LOCK_MS = 60 * 1000;

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

/** 'salt:hash' 형식으로 만든다. */
export async function makePinHash(pin: string): Promise<string> {
  const salt = Crypto.randomUUID();
  return `${salt}:${await hashPin(pin, salt)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  return !!salt && !!hash && (await hashPin(pin, salt)) === hash;
}

/**
 * 관리자 계정이 한 번 더 확인하는 '관리자 로그인'.
 * 처음이면 관리자 비밀번호를 만들고, 다음부터는 그 비밀번호로 들어간다.
 */
export function AdminLoginModal({
  visible,
  onClose,
  onSuccess,
  accountLabel,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountLabel: string;
}) {
  const theme = useTheme();
  const pinHash = useStore((s) => s.adminPinHash);
  const creating = !pinHash;
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPin('');
      setPin2('');
      setError('');
    }
  }, [visible]);

  const submit = async () => {
    if (busy) return;
    setError('');
    if (Date.now() < lockedUntil) {
      setError(`잠시 후 다시 시도해 주세요 (${Math.ceil((lockedUntil - Date.now()) / 1000)}초).`);
      return;
    }
    if (pin.length < 6) {
      setError('관리자 비밀번호는 6자 이상이에요.');
      return;
    }
    setBusy(true);
    try {
      const { setAdminPinHash, setAdminUnlockedUntil } = useStore.getState();
      if (creating) {
        if (pin !== pin2) {
          setError('두 비밀번호가 서로 달라요.');
          return;
        }
        setAdminPinHash(await makePinHash(pin));
      } else if (!(await verifyPin(pin, pinHash!))) {
        const n = tries + 1;
        setTries(n);
        if (n >= MAX_TRIES) {
          setLockedUntil(Date.now() + LOCK_MS);
          setTries(0);
          setError('비밀번호를 여러 번 틀려 1분 동안 잠겼어요.');
        } else {
          setError(`비밀번호가 맞지 않아요 (${n}/${MAX_TRIES}).`);
        }
        return;
      }
      setTries(0);
      setAdminUnlockedUntil(Date.now() + ADMIN_SESSION_MS);
      onSuccess();
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: theme.background }]} onPress={() => {}}>
          <Text style={styles.lock}>🛡️</Text>
          <Text style={[styles.title, { color: theme.text }]}>관리자 로그인</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {accountLabel}
            {'\n'}
            {creating
              ? '처음이라 관리자 비밀번호를 만들어요. 다음부터 관리자 페이지에 들어갈 때 이 비밀번호를 한 번 더 입력해요.'
              : '관리자 페이지에 들어가려면 관리자 비밀번호를 입력하세요.'}
          </Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            autoFocus
            placeholder={creating ? '새 관리자 비밀번호 (6자 이상)' : '관리자 비밀번호'}
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={creating ? undefined : submit}
            style={inputStyle}
          />
          {creating && (
            <TextInput
              value={pin2}
              onChangeText={setPin2}
              secureTextEntry
              placeholder="한 번 더 입력"
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={submit}
              style={inputStyle}
            />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: theme.backgroundSelected }]}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>취소</Text>
            </Pressable>
            <Pressable onPress={submit} style={[styles.btn, styles.primary, busy && { opacity: 0.6 }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{creating ? '만들고 들어가기' : '로그인'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 400, borderRadius: 18, padding: 22, gap: 10 },
  lock: { fontSize: 34, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, height: 44, paddingHorizontal: 12, fontSize: 15 },
  error: { color: '#e11d48', fontSize: 13 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  btn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#1b2c9e', borderColor: '#1b2c9e' },
});
