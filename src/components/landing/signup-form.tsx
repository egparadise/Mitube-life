import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/components/auth-provider';
import { FormField } from '@/components/landing/form-field';
import { GoogleButton } from '@/components/landing/google-button';
import { useTheme } from '@/hooks/use-theme';
import {
  authErrorMessage,
  completeSignUp,
  isUsernameAvailable,
  sendPhoneCode,
  signInWithGoogle,
  SMS_VERIFY_ENABLED,
  signOut,
  verifyPhoneCode,
} from '@/services/auth';
import { NotConfiguredError } from '@/services/supabase';
import { useStore } from '@/store/store';
import {
  checkEmail,
  checkName,
  checkPassword,
  checkPasswordConfirm,
  checkUsername,
  formatKoreanPhone,
  MIN_SIGNUP_AGE,
  parseBirth,
  toE164Korean,
} from '@/utils/signup-validation';

const RED = '#ff0033';
const CODE_SECONDS = 180;

interface Props {
  /** 가입(또는 이미 가입된 번호로 로그인) 완료 후 앱으로 들어간다. */
  onDone: () => void;
  onBack: () => void;
  onGoLogin: () => void;
}

type Busy = null | 'id' | 'send' | 'verify' | 'submit' | 'google';

/** 회원가입: 아이디 · 이름 · 생년월일/성별 · 이메일 · 비밀번호 · 휴대폰 인증 · 약관 동의. */
export function SignUpForm({ onDone, onBack, onGoLogin }: Props) {
  const theme = useTheme();
  const { configured } = useAuth();
  const setSignupInProgress = useStore((s) => s.setSignupInProgress);

  const [username, setUsername] = useState('');
  const [idState, setIdState] = useState<'unchecked' | 'ok' | 'taken'>('unchecked');
  const [fullName, setFullName] = useState('');
  const [birth6, setBirth6] = useState('');
  const [genderDigit, setGenderDigit] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [left, setLeft] = useState(0);
  const [phoneMsg, setPhoneMsg] = useState<{ ok?: string; error?: string }>({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [openDoc, setOpenDoc] = useState<null | 'terms' | 'privacy'>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<null | { emailPending: boolean }>(null);

  // 인증번호 남은 시간
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // 화면을 떠나면 '가입 중' 표시를 거둔다.
  useEffect(() => () => setSignupInProgress(false), [setSignupInProgress]);

  const birth = parseBirth(birth6, genderDigit);
  const usernameFormat = checkUsername(username);
  const errors = {
    username:
      usernameFormat ??
      (idState === 'taken' ? '이미 사용 중인 아이디예요.' : idState !== 'ok' ? '아이디 중복 확인을 해 주세요.' : null),
    fullName: checkName(fullName),
    birth:
      typeof birth === 'string'
        ? birth
        : birth.age < MIN_SIGNUP_AGE
          ? `만 ${MIN_SIGNUP_AGE}세 이상만 가입할 수 있어요.`
          : null,
    email: checkEmail(email),
    pw: checkPassword(pw),
    pw2: checkPasswordConfirm(pw, pw2),
    phone: !SMS_VERIFY_ENABLED || verified ? null : '휴대폰 인증을 완료해 주세요.',
    agree: agreeTerms && agreePrivacy ? null : '필수 항목에 모두 동의해 주세요.',
  };
  // 입력을 시작한 칸은 바로, 나머지는 '가입하기'를 누른 뒤 오류를 보여 준다.
  const show = (key: keyof typeof errors, typed: boolean) => (submitted || typed ? errors[key] : null);

  const guard = () => {
    if (configured) return true;
    setFormError(new NotConfiguredError().message);
    return false;
  };

  const checkId = async () => {
    if (usernameFormat) return;
    if (!guard()) return;
    setBusy('id');
    setFormError('');
    try {
      setIdState((await isUsernameAvailable(username)) ? 'ok' : 'taken');
    } catch (e) {
      setFormError(authErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const sendCode = async () => {
    const e164 = toE164Korean(phone);
    if (!e164) {
      setPhoneMsg({ error: '휴대폰 번호를 확인해 주세요 (예: 010-1234-5678).' });
      return;
    }
    if (!guard()) return;
    setBusy('send');
    setPhoneMsg({});
    try {
      setSignupInProgress(true);
      await sendPhoneCode(e164);
      setCodeSent(true);
      setVerified(false);
      setCode('');
      setLeft(CODE_SECONDS);
      setPhoneMsg({ ok: '인증번호를 보냈어요. 3분 안에 입력해 주세요.' });
    } catch (e) {
      setSignupInProgress(false);
      setPhoneMsg({ error: authErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    const e164 = toE164Korean(phone);
    if (!e164) return;
    if (left <= 0) {
      setPhoneMsg({ error: '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.' });
      return;
    }
    if (!/^\d{4,8}$/.test(code.trim())) {
      setPhoneMsg({ error: '문자로 받은 인증번호를 입력해 주세요.' });
      return;
    }
    setBusy('verify');
    try {
      const { alreadyMember } = await verifyPhoneCode(e164, code);
      if (alreadyMember) {
        // 이미 가입한 번호 — 휴대폰 인증으로 그 계정에 로그인된 상태이므로 그대로 들어간다.
        setSignupInProgress(false);
        onDone();
        return;
      }
      setVerified(true);
      setLeft(0);
      setPhoneMsg({ ok: '휴대폰 인증이 완료됐어요.' });
    } catch (e) {
      setPhoneMsg({ error: authErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    setSubmitted(true);
    setFormError('');
    if (Object.values(errors).some(Boolean) || typeof birth === 'string') return;
    if (!guard()) return;
    setBusy('submit');
    // 가입이 끝날 때까지 소개 화면이 닫히지 않도록 (이메일 가입은 계정이 생기는 순간 로그인된다)
    setSignupInProgress(true);
    try {
      const r = await completeSignUp({
        username,
        fullName,
        birthDate: birth.birthDate,
        gender: birth.gender,
        email,
        password: pw,
        phone: verified ? toE164Korean(phone) : null,
      });
      setSignupInProgress(false);
      setResult({ emailPending: r.emailConfirmationPending });
    } catch (e) {
      setSignupInProgress(false);
      const message = authErrorMessage(e);
      if (message.includes('아이디')) setIdState('taken');
      setFormError(message);
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    // 휴대폰 인증만 하고 그만두면 반쯤 만들어진 로그인 상태를 정리한다.
    if (verified && !result) await signOut().catch(() => {});
    setSignupInProgress(false);
    onBack();
  };

  if (result) {
    return (
      <View style={styles.done}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={[styles.doneTitle, { color: theme.text }]}>가입을 환영해요, {fullName.trim()}님!</Text>
        <Text style={[styles.doneText, { color: theme.textSecondary }]}>
          아이디 <Text style={{ fontWeight: '800', color: theme.text }}>{username.toLowerCase()}</Text> 로 가입이
          끝났어요.{'\n'}
          {result.emailPending
            ? `${email.trim()} 로 확인 메일을 보냈어요. 메일의 링크를 누르면 이메일로도 로그인할 수 있어요.\n(휴대폰 번호·아이디로는 지금 바로 로그인돼요.)`
            : '이제 분류함과 채널이 계정에 저장돼 어느 기기에서든 이어서 쓸 수 있어요.'}
        </Text>
        <Pressable onPress={onDone} role="button" aria-label="시작하기" style={[styles.primary, styles.doneButton]}>
          <Text style={styles.primaryText}>마이 튜브 시작하기</Text>
        </Pressable>
      </View>
    );
  }

  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>회원가입</Text>
      {!configured && (
        <Text style={styles.notice}>
          지금은 서버(Supabase) 연결 설정 전이라 화면만 미리 볼 수 있어요. 설정을 마치면 실제로 가입돼요.
        </Text>
      )}

      {/* 가장 쉬운 가입: 구글 계정 (처음이면 자동 가입, 다음부터는 같은 버튼으로 로그인) */}
      <GoogleButton
        busy={busy === 'google'}
        onPress={async () => {
          setFormError('');
          if (!configured) {
            setFormError(new NotConfiguredError().message);
            return;
          }
          setBusy('google');
          try {
            await signInWithGoogle();
          } catch (e) {
            setFormError(authErrorMessage(e));
            setBusy(null);
          }
        }}
      />
      <Text
        style={[styles.notice, { color: theme.textSecondary, backgroundColor: 'transparent', textAlign: 'center' }]}>
        Google 계정이 있으면 아래 양식 없이 바로 가입돼요. 또는 아래에서 직접 가입하세요.
      </Text>
      {formError && busy !== 'submit' && !submitted ? (
        <Text style={[styles.error, styles.formError]}>{formError}</Text>
      ) : null}

      <FormField
        label="아이디"
        required
        value={username}
        onChangeText={(v) => {
          setUsername(v);
          setIdState('unchecked');
        }}
        placeholder="영문 소문자로 시작, 4~20자"
        autoCapitalize="none"
        error={show('username', username.length > 0 && (!!usernameFormat || idState === 'taken'))}
        ok={idState === 'ok' ? '사용할 수 있는 아이디예요.' : null}
        right={<SmallButton label="중복확인" onPress={checkId} busy={busy === 'id'} disabled={!!usernameFormat} />}
      />

      <FormField
        label="이름"
        required
        value={fullName}
        onChangeText={setFullName}
        placeholder="홍길동"
        error={show('fullName', fullName.length > 0)}
      />

      {/* 주민번호: 앞 6자리 + 뒷자리 첫 숫자만 받는다 */}
      <View style={styles.block}>
        <Text style={[styles.label, { color: theme.text }]}>
          생년월일 · 성별 <Text style={{ color: RED }}>*</Text>
        </Text>
        <View style={styles.rrnRow}>
          <TextInput
            value={birth6}
            onChangeText={(v) => setBirth6(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="900101"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            aria-label="주민등록번호 앞 6자리(생년월일)"
            style={[styles.input, styles.rrnFront, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
          <Text style={[styles.rrnDash, { color: theme.textSecondary }]}>-</Text>
          <TextInput
            value={genderDigit}
            onChangeText={(v) => setGenderDigit(v.replace(/[^1-4]/g, '').slice(0, 1))}
            placeholder="1"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={1}
            aria-label="주민등록번호 뒷자리 첫 숫자(성별)"
            style={[styles.input, styles.rrnDigit, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
          <Text style={[styles.rrnMask, { color: theme.textSecondary }]}>●●●●●●</Text>
        </View>
        {show('birth', birth6.length === 6 && genderDigit.length === 1) ? (
          <Text style={styles.error}>{errors.birth}</Text>
        ) : typeof birth !== 'string' ? (
          <Text style={styles.ok}>
            {birth.birthDate.replace(/-/g, '.')} · {birth.gender === 'male' ? '남성' : '여성'}
          </Text>
        ) : (
          <Text style={[styles.help, { color: theme.textSecondary }]}>
            주민번호 전체는 받지 않아요. 생년월일과 성별만 저장해요.
          </Text>
        )}
      </View>

      <FormField
        label="이메일"
        required
        value={email}
        onChangeText={setEmail}
        placeholder="name@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        error={show('email', email.length > 0)}
      />

      <FormField
        label="비밀번호"
        required
        value={pw}
        onChangeText={setPw}
        placeholder="영문+숫자 8자 이상"
        secureTextEntry
        autoCapitalize="none"
        error={show('pw', pw.length > 0)}
      />
      <FormField
        label="비밀번호 확인"
        required
        value={pw2}
        onChangeText={setPw2}
        placeholder="비밀번호를 한 번 더"
        secureTextEntry
        autoCapitalize="none"
        error={show('pw2', pw2.length > 0)}
        ok={pw2 && !errors.pw2 ? '비밀번호가 일치해요.' : null}
      />

      {/* 휴대폰 인증 (문자 발송 서비스를 연결해 켰을 때만) */}
      {SMS_VERIFY_ENABLED && (
        <>
          <FormField
            label="휴대폰 번호"
            required
            value={formatKoreanPhone(phone)}
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, '').slice(0, 11));
              if (verified) setVerified(false);
            }}
            placeholder="010-1234-5678"
            keyboardType="phone-pad"
            editable={!verified}
            error={phoneMsg.error ?? show('phone', false)}
            ok={phoneMsg.ok}
            right={
              <SmallButton
                label={verified ? '인증 완료' : codeSent ? '재발송' : '인증번호 발송'}
                onPress={sendCode}
                busy={busy === 'send'}
                disabled={verified}
              />
            }
          />
          {codeSent && !verified && (
            <View style={styles.codeRow}>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))}
                placeholder="인증번호 6자리"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                aria-label="인증번호"
                style={[
                  styles.input,
                  styles.codeInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
              <Text style={[styles.timer, { color: left > 0 ? RED : theme.textSecondary }]}>
                {left > 0 ? mmss : '시간 초과'}
              </Text>
              <SmallButton label="확인" onPress={verify} busy={busy === 'verify'} disabled={left <= 0} />
            </View>
          )}
        </>
      )}

      {/* 약관 동의 */}
      <View style={[styles.agreeBox, { backgroundColor: theme.backgroundElement }]}>
        <CheckRow
          checked={agreeTerms && agreePrivacy}
          onToggle={() => {
            const next = !(agreeTerms && agreePrivacy);
            setAgreeTerms(next);
            setAgreePrivacy(next);
          }}
          label="전체 동의"
          bold
        />
        <View style={[styles.hr, { backgroundColor: theme.backgroundSelected }]} />
        <CheckRow
          checked={agreeTerms}
          onToggle={() => setAgreeTerms((v) => !v)}
          label="[필수] 이용약관 동의"
          onView={() => setOpenDoc(openDoc === 'terms' ? null : 'terms')}
        />
        {openDoc === 'terms' && <Text style={[styles.doc, { color: theme.textSecondary }]}>{TERMS}</Text>}
        <CheckRow
          checked={agreePrivacy}
          onToggle={() => setAgreePrivacy((v) => !v)}
          label="[필수] 개인정보 수집·이용 동의"
          onView={() => setOpenDoc(openDoc === 'privacy' ? null : 'privacy')}
        />
        {openDoc === 'privacy' && <Text style={[styles.doc, { color: theme.textSecondary }]}>{PRIVACY_CONSENT}</Text>}
        {show('agree', false) ? <Text style={styles.error}>{errors.agree}</Text> : null}
      </View>

      {formError ? <Text style={[styles.error, styles.formError]}>{formError}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={busy === 'submit'}
        role="button"
        aria-label="가입하기"
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        {busy === 'submit' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>가입하기</Text>}
      </Pressable>

      <View style={styles.footerRow}>
        <Pressable onPress={cancel} role="button" aria-label="뒤로">
          <Text style={[styles.link, { color: theme.textSecondary }]}>← 뒤로</Text>
        </Pressable>
        <Pressable onPress={onGoLogin} role="button" aria-label="로그인하기">
          <Text style={[styles.link, { color: theme.text }]}>
            이미 회원이신가요? <Text style={{ color: RED, fontWeight: '800' }}>로그인</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      role="button"
      aria-label={label}
      style={({ pressed }) => [
        styles.small,
        { backgroundColor: disabled ? theme.backgroundSelected : theme.text, opacity: pressed ? 0.7 : 1 },
      ]}>
      {busy ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <Text style={[styles.smallText, { color: disabled ? theme.textSecondary : theme.background }]}>{label}</Text>
      )}
    </Pressable>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
  bold,
  onView,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  bold?: boolean;
  onView?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.checkRow}>
      <Pressable onPress={onToggle} role="checkbox" aria-checked={checked} aria-label={label} style={styles.checkHit}>
        <View
          style={[
            styles.box,
            { borderColor: checked ? RED : theme.textSecondary, backgroundColor: checked ? RED : 'transparent' },
          ]}>
          {checked ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={[styles.checkLabel, { color: theme.text }, bold && { fontWeight: '800' }]}>{label}</Text>
      </Pressable>
      {onView ? (
        <Pressable onPress={onView} role="button" aria-label={`${label} 내용 보기`}>
          <Text style={[styles.view, { color: theme.textSecondary }]}>보기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const TERMS = `마이 튜브 이용약관 (요약)
1. 마이 튜브는 회원이 구독한 유튜브 채널을 분류·정리하고 새 영상과 볼 시간을 알려 주는 서비스입니다.
2. 회원은 본인의 정보로 가입해야 하며, 계정을 다른 사람에게 넘기거나 빌려줄 수 없습니다.
3. 유튜브 데이터는 회원이 연결한 경우에만 읽기 전용으로 사용하며, 회원은 언제든 연결을 해제할 수 있습니다.
4. 회원은 언제든 탈퇴할 수 있으며, 탈퇴하면 회원 정보와 저장된 분류 정보는 지체 없이 삭제됩니다.`;

const PRIVACY_CONSENT = `개인정보 수집·이용 동의
• 수집 항목: 아이디, 이름, 생년월일, 성별, 이메일, 휴대폰 번호, 비밀번호(암호화하여 저장)
• 수집 목적: 회원 식별과 가입 의사 확인, 휴대폰 본인 확인, 서비스 제공(분류함·구독 채널·알림 설정 저장과 기기 간 동기화), 문의 응대
• 보유 기간: 회원 탈퇴 시까지 (탈퇴 즉시 파기, 법령에 따라 보관이 필요한 경우 그 기간)
• 주민등록번호는 수집하지 않습니다. 생년월일·성별 확인을 위해 앞 6자리와 뒷자리 첫 숫자만 입력받아 생년월일과 성별로만 저장합니다.
• 동의를 거부할 수 있으며, 거부하면 회원가입이 제한됩니다. (가입하지 않고도 이 기기에서 앱을 쓸 수 있어요.)`;

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
  block: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { fontSize: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  rrnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rrnFront: { width: 120, letterSpacing: 2 },
  rrnDash: { fontSize: 18, fontWeight: '700' },
  rrnDigit: { width: 46, textAlign: 'center' },
  rrnMask: { fontSize: 16, letterSpacing: 3 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeInput: { flex: 1, minWidth: 0, letterSpacing: 2 },
  timer: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 56, textAlign: 'center' },
  help: { fontSize: 13 },
  ok: { color: '#0b8a4b', fontSize: 13 },
  error: { color: '#ef4444', fontSize: 13 },
  formError: { textAlign: 'center', fontSize: 14 },
  small: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 92,
    alignItems: 'center',
  },
  smallText: { fontSize: 14, fontWeight: '700' },
  agreeBox: { padding: 14, borderRadius: 14, gap: 10 },
  hr: { height: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkHit: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 16 },
  checkLabel: { fontSize: 14 },
  view: { fontSize: 13, textDecorationLine: 'underline' },
  doc: { fontSize: 12, lineHeight: 18, paddingLeft: 32 },
  primary: {
    backgroundColor: RED,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontSize: 14 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  doneEmoji: { fontSize: 52 },
  doneTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  doneText: { fontSize: 15, lineHeight: 23, textAlign: 'center' },
  doneButton: { alignSelf: 'stretch', marginTop: 8 },
});
