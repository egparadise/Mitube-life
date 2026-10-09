import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface Section {
  title: string;
  body: string;
}

// 저장소 문서 PRIVACY_POLICY.md 의 핵심을 앱 안에 간결히 담은 요약본.
const SECTIONS: Section[] = [
  {
    title: '한마디 요약',
    body: '지금 버전에는 개인정보를 받는 서버가 없습니다. 내가 만든 분류함·채널 분류·설정은 모두 이 기기(웹은 이 브라우저)에만 저장되며 개발자에게 전송되지 않습니다. 유튜브는 "읽기만" 하고, 무엇도 바꾸거나 올리지 않습니다. 회원가입·클라우드 동기화는 준비 중이며, 켜기 전에 이 방침을 먼저 고쳐 알려드립니다.',
  },
  {
    title: '기기에만 저장',
    body: '분류함, 채널 분류 결과, 알림 설정, 채널별 최근 영상 목록(제목·썸네일·게시 시각), 그리고 직접 입력한 구글 클라이언트 ID·YouTube API 키와 유튜브 로그인 토큰(약 1시간 유효)은 이 기기의 저장소(웹은 브라우저 저장소)에만 보관됩니다.',
  },
  {
    title: '유튜브 연결 (읽기 전용)',
    body: '구독 채널 목록(채널 이름·아이콘·설명)과, 새 영상을 알려 드리기 위해 각 구독 채널의 공개 업로드 목록(최근 영상 제목·썸네일·게시 시각)을 불러옵니다. 사용 권한은 읽기 전용(youtube.readonly) 하나뿐이라 구독 추가·삭제·댓글·업로드는 불가능합니다. 불러온 정보는 기기 안에서만 쓰입니다.',
  },
  {
    title: '외부 연결',
    body: '유튜브 정보는 이 기기에서 Google(YouTube Data API)에 직접 요청합니다. 웹사이트는 Firebase Hosting으로 제공되고, 소개 화면의 예시 사진은 Unsplash에서 불러옵니다. 이때 각 회사가 일반적인 접속 기록(IP 주소 등)을 받을 수 있습니다.',
  },
  {
    title: '제3자 제공 없음',
    body: '수집한 정보를 어떤 제3자에게도 전송·공유·판매하지 않습니다. 광고 추적, 위치·연락처 접근을 하지 않으며, Google API Services User Data Policy(제한적 사용 포함)를 준수합니다.',
  },
  {
    title: '연결 해제 · 데이터 삭제',
    body: '앱의 "YouTube 연결" 화면에서 연결 해제할 수 있고, myaccount.google.com/connections 에서 앱 권한을 완전히 제거할 수 있습니다. 설정의 "전체 초기화"를 두 번 누르면 이 기기에 저장된 분류·채널·알림과 유튜브 로그인 토큰·API 키·클라이언트 정보가 모두 지워집니다. 휴대폰은 앱 삭제, 웹은 브라우저의 사이트 데이터 삭제로도 지울 수 있습니다.',
  },
  {
    title: '문의',
    body: '개인정보 처리 문의는 개발자 이메일로 연락해 주세요. (배포용 전문은 PRIVACY_POLICY.md 참고)',
  },
];

export function PrivacyModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">개인정보처리방침</ThemedText>
          <Pressable onPress={onClose} hitSlop={10}>
            <ThemedText type="default" style={{ color: '#FF0033' }}>
              닫기
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
          {SECTIONS.map((s) => (
            <View key={s.title} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">{s.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
                {s.body}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: 4 },
  body: { lineHeight: 20 },
});
