import * as AuthSession from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchSubscriptions } from '@/services/youtube';
import { useStore } from '@/store/store';

// 구글 로그인 팝업 마무리(maybeCompleteAuthSession)는 모든 화면에서 실행되도록 auth-provider.tsx 에서 한다.

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

type Status = 'idle' | 'connecting' | 'fetching' | 'error' | 'done';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function YouTubeConnectModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const savedClientId = useStore((s) => s.googleClientId);
  const youtubeConnected = useStore((s) => s.youtubeConnected);
  const channelCount = useStore((s) => s.channels.length);
  const setGoogleAuth = useStore((s) => s.setGoogleAuth);
  const importYouTubeChannels = useStore((s) => s.importYouTubeChannels);
  const disconnectYouTube = useStore((s) => s.disconnectYouTube);
  const setToken = useStore((s) => s.setToken);
  const savedApiKey = useStore((s) => s.youtubeApiKey);
  const setYoutubeApiKey = useStore((s) => s.setYoutubeApiKey);
  const [apiKey, setApiKey] = useState(savedApiKey);
  const [apiKeyNote, setApiKeyNote] = useState('');

  const [clientId, setClientId] = useState(savedClientId);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [imported, setImported] = useState(0);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'favorit' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId.trim() || 'unconfigured',
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Token, // 짧은 수명 액세스 토큰을 바로 받음
      usePKCE: false, // implicit 흐름에서는 PKCE 파라미터를 보내면 구글이 400 거부
    },
    discovery,
  );

  // 모달이 열릴 때 저장된 값으로 동기화.
  useEffect(() => {
    if (visible) {
      setClientId(savedClientId);
      setApiKey(savedApiKey);
      setApiKeyNote('');
      setStatus('idle');
      setMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, savedClientId]);

  // 인증 결과 처리.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const token =
        response.authentication?.accessToken ?? (response.params?.access_token as string | undefined);
      // 토큰 유효 시간(초). 구글 기본값은 3600초(1시간).
      const expiresIn =
        response.authentication?.expiresIn ?? (Number(response.params?.expires_in) || 3600);
      if (token) loadSubscriptions(token, Date.now() + expiresIn * 1000);
      else {
        setStatus('error');
        setMessage('액세스 토큰을 받지 못했습니다. 클라이언트 유형/리디렉션 URI 설정을 확인하세요.');
      }
    } else if (response.type === 'error') {
      setStatus('error');
      setMessage(
        response.params?.error_description || response.error?.message || '인증에 실패했습니다.',
      );
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      if (status === 'connecting') setStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function loadSubscriptions(accessToken: string, expiresAt: number) {
    try {
      setStatus('fetching');
      setMessage('구독 목록을 불러오는 중…');
      const channels = await fetchSubscriptions(accessToken);
      importYouTubeChannels(channels);
      // 채널을 넣은 뒤에 토큰을 저장해야, 구독 화면이 바뀐 채널 목록으로 새 영상 확인을 시작한다.
      setToken(accessToken, expiresAt);
      setImported(channels.length);
      setStatus('done');
      setMessage('');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  const canConnect = clientId.trim().length > 0 && !!request && status !== 'connecting';

  const onConnect = async () => {
    setGoogleAuth(clientId, '');
    setStatus('connecting');
    setMessage('구글 로그인 창을 여는 중…');
    await promptAsync();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">YouTube 연결</ThemedText>
          <Pressable onPress={onClose} hitSlop={10}>
            <ThemedText type="default" style={{ color: '#FF0033' }}>
              닫기
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
          {youtubeConnected ? (
            <View style={[styles.statusCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.bigEmoji}>✅</ThemedText>
              <ThemedText type="smallBold">유튜브가 연결되어 있습니다</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                현재 {channelCount}개 채널이 들어와 있어요.{'\n'}새 구독을 반영하려면 다시 불러오세요.
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
              내 실제 구독 목록을 가져오려면 구글 인증키(클라이언트 ID)가 한 번 필요합니다.{'\n'}
              아래 안내를 따라 설정한 뒤, 클라이언트 ID를 붙여넣고 연결하세요.
            </ThemedText>
          )}

          {/* 설정 안내 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            준비 (최초 1회)
          </ThemedText>
          <View style={[styles.guide, { backgroundColor: theme.backgroundElement }]}>
            <Guide n="1" text="Google Cloud Console(console.cloud.google.com)에서 프로젝트를 만든다." />
            <Guide n="2" text='"YouTube Data API v3"를 사용 설정(Enable)한다.' />
            <Guide n="3" text='OAuth 동의 화면을 만들고, 본인 계정을 "테스트 사용자"로 추가한다.' />
            <Guide n="4" text='"사용자 인증 정보 → OAuth 클라이언트 ID → 웹 애플리케이션"을 만든다.' />
            <Guide n="5" text="아래 리디렉션 URI를 그 클라이언트의 '승인된 리디렉션 URI'에 추가한다." />
            <Guide n="6" text="생성된 클라이언트 ID를 복사해 아래 칸에 붙여넣는다." last />
          </View>

          {/* 리디렉션 URI */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            승인된 리디렉션 URI (그대로 복사해 등록)
          </ThemedText>
          <View style={[styles.codeBox, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" selectable style={styles.code}>
              {redirectUri}
            </ThemedText>
          </View>

          {/* 클라이언트 ID 입력 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            OAuth 클라이언트 ID
          </ThemedText>
          <TextInput
            value={clientId}
            onChangeText={setClientId}
            placeholder="000000-xxxx.apps.googleusercontent.com"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />

          {/* 최신 영상 자동 불러오기용 API 키 (선택) */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            YouTube API 키 (선택 · 로그인 없이 최신 영상 자동 불러오기)
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.keyHelp}>
            로그인은 1시간마다 풀리지만, API 키가 있으면 앱을 열 때마다 채널별 최신 영상(썸네일)을 자동으로
            불러와요. Google Cloud Console → API 및 서비스 → 사용자 인증 정보 → + 사용자 인증 정보 만들기 →
            API 키 → 만든 키의 'API 제한사항'을 YouTube Data API v3 로, '애플리케이션 제한사항'을 웹사이트
            (http://localhost:8081/*, https://mitube-life.web.app/*, https://mitube-life.firebaseapp.com/*)로
            지정한 뒤 붙여넣으세요.
          </ThemedText>
          <View style={styles.keyRow}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="AIza…"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.keyInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
            <Pressable
              onPress={() => {
                setYoutubeApiKey(apiKey);
                setApiKeyNote(apiKey.trim() ? '저장했어요. 구독 화면을 열면 최신 영상을 불러와요.' : 'API 키를 지웠어요.');
              }}
              role="button"
              aria-label="API 키 저장"
              style={({ pressed }) => [styles.keySave, pressed && { opacity: 0.7 }]}>
              <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                저장
              </ThemedText>
            </Pressable>
          </View>
          {apiKeyNote ? (
            <ThemedText type="small" style={styles.success}>
              {apiKeyNote}
            </ThemedText>
          ) : null}

          {/* 상태 메시지 */}
          {status === 'error' && (
            <ThemedText type="small" style={styles.error}>
              ⚠️ {message}
            </ThemedText>
          )}
          {(status === 'connecting' || status === 'fetching') && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.statusMsg}>
              {message}
            </ThemedText>
          )}
          {status === 'done' && (
            <ThemedText type="small" style={styles.success}>
              🎉 {imported}개 채널을 불러와 자동 분류했어요! "구독" 탭에서 확인하세요.
            </ThemedText>
          )}

          <PrimaryButton
            label={youtubeConnected ? '구독 목록 다시 불러오기' : '구글 로그인하고 연결'}
            onPress={onConnect}
            disabled={!canConnect}
            loading={status === 'connecting' || status === 'fetching'}
            style={styles.connectButton}
          />

          {youtubeConnected && (
            <Pressable onPress={disconnectYouTube} style={styles.disconnect}>
              <ThemedText type="small" style={{ color: '#EF4444' }}>
                연결 해제
              </ThemedText>
            </Pressable>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            ℹ️ 개인용/테스트 단계에서는 구글 심사 없이 본인(테스트 사용자) 계정으로 바로 사용할 수
            있습니다. 로그인 시 "확인되지 않은 앱" 경고가 보이면 "고급 → 계속"으로 진행하세요.
          </ThemedText>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Guide({ n, text, last }: { n: string; text: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.guideRow, !last && { marginBottom: Spacing.two }]}>
      <View style={[styles.guideNum, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="small">{n}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.guideText}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  intro: { lineHeight: 20, marginBottom: Spacing.two },
  statusCard: {
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  bigEmoji: { fontSize: 36 },
  center: { textAlign: 'center', lineHeight: 20 },
  sectionTitle: { marginTop: Spacing.three, marginBottom: Spacing.one },
  guide: { padding: Spacing.three, borderRadius: Spacing.three },
  guideRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  guideNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: { flex: 1, lineHeight: 20 },
  codeBox: { padding: Spacing.three, borderRadius: Spacing.three },
  code: { fontFamily: 'monospace' },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 14,
  },
  error: { color: '#EF4444', lineHeight: 20, marginTop: Spacing.one },
  success: { color: '#10B981', lineHeight: 20, marginTop: Spacing.one },
  statusMsg: { marginTop: Spacing.one },
  connectButton: { marginTop: Spacing.three },
  disconnect: { alignItems: 'center', paddingVertical: Spacing.three },
  note: { marginTop: Spacing.three, lineHeight: 20 },
  keyHelp: { lineHeight: 19 },
  keyRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  keyInput: { flex: 1 },
  keySave: {
    backgroundColor: '#ff0033',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
