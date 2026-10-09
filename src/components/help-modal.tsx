import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: '📺',
    title: '1. 채널 불러오기',
    body: '[설정] 탭에서 "데모 채널 다시 불러오기"를 누르면 예시 구독 목록이 들어옵니다. 실제 내 유튜브 구독을 가져오려면 아래 "유튜브 연결"을 사용하세요.',
  },
  {
    emoji: '🗂️',
    title: '2. 분류함 만들기',
    body: '[설정] 탭 → 분류함의 "+ 추가"를 누르고 이름·아이콘·색상을 정하면 나만의 분류함이 생깁니다. (예: 영어 학습, 인공지능, 여행 …)',
  },
  {
    emoji: '✨',
    title: '3. 자동 분류',
    body: '채널을 불러오면 제목·소개글을 분석해 가장 어울리는 분류함에 자동으로 들어갑니다. 딱 맞는 곳이 없으면 "미분류"에 모입니다.',
  },
  {
    emoji: '↔️',
    title: '4. 채널 옮기기',
    body: '[구독] 탭에서 채널 오른쪽의 "이동" 버튼을 누르고 옮길 분류함을 고르면 됩니다. 언제든 자유롭게 옮길 수 있어요.',
  },
  {
    emoji: '✏️',
    title: '5. 분류함 수정·삭제',
    body: '[설정] 탭에서 분류함을 누르면 이름·아이콘·색상을 바꾸거나 삭제할 수 있습니다. 분류함을 지워도 채널은 사라지지 않고 "미분류"로 돌아갑니다.',
  },
  {
    emoji: '💾',
    title: '6. 자동 저장',
    body: '만든 분류와 옮긴 내용은 이 기기에 자동 저장됩니다. 앱을 껐다 켜도 그대로 유지돼요.',
  },
  {
    emoji: '🔗',
    title: '7. 유튜브 연결 (실제 구독)',
    body: '[설정] → "YouTube 계정 연결"에서 구글 로그인 후 내 실제 구독 목록을 가져올 수 있습니다. 최초 1회 구글 인증키 설정이 필요하며, 화면 안내를 따라 하면 됩니다.',
  },
];

export function HelpModal({ visible, onClose }: HelpModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">도움말</ThemedText>
          <Pressable onPress={onClose} hitSlop={10}>
            <ThemedText type="default" style={{ color: '#FF0033' }}>
              닫기
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            마이 튜브은 내 유튜브 구독 채널을 내가 만든 분류함으로 정리하는 앱입니다.{'\n'}
            아래 순서대로 따라 해 보세요.
          </ThemedText>

          {STEPS.map((step) => (
            <View
              key={step.title}
              style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.cardEmoji}>{step.emoji}</ThemedText>
              <View style={styles.cardText}>
                <ThemedText type="smallBold">{step.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardBody}>
                  {step.body}
                </ThemedText>
              </View>
            </View>
          ))}

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            더 궁금한 점이 있으면 언제든 물어보세요. 🙂
          </ThemedText>
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
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  intro: {
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardBody: { lineHeight: 20 },
  footer: { textAlign: 'center', marginTop: Spacing.four, lineHeight: 20 },
});
