import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HScroller } from '@/components/h-scroller';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { CategoryColors, CategoryEmojis } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Category } from '@/types';

interface CategoryFormModalProps {
  visible: boolean;
  /** 있으면 수정 모드, 없으면 추가 모드. */
  editing?: Category | null;
  /** 하위 분류함을 새로 만들 때 그 상위 분류함 이름 (제목에 표시). */
  parentName?: string;
  onSubmit: (name: string, emoji: string, color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function CategoryFormModal({
  visible,
  editing,
  parentName,
  onSubmit,
  onDelete,
  onClose,
}: CategoryFormModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CategoryEmojis[0]);
  const [color, setColor] = useState<string>(CategoryColors[0]);

  // 모달이 열릴 때마다 초기값 세팅.
  useEffect(() => {
    if (!visible) return;
    setName(editing?.name ?? '');
    setEmoji(editing?.emoji ?? CategoryEmojis[0]);
    setColor(editing?.color ?? CategoryColors[0]);
  }, [visible, editing]);

  const canSubmit = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* iOS: 키보드가 올라오면 시트도 함께 올린다 (안드로이드는 화면이 알아서 줄어든다). */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.four },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {/* 화면이 낮거나 키보드가 떠도 '추가' 버튼까지 닿도록 내용은 스크롤된다. */}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollBody}>
          <ThemedText type="subtitle" style={styles.title}>
            {editing
              ? editing.parentId
                ? '하위 분류함 수정'
                : '분류함 수정'
              : parentName
                ? `새 하위 분류함 · ${parentName}`
                : '새 분류함'}
          </ThemedText>

          {/* 이름 */}
          <ThemedText type="smallBold" style={styles.label}>
            이름
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={parentName || editing?.parentId ? "예: 코딩" : "예: 영어 학습"}
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundElement, color: theme.text },
            ]}
            autoFocus
            maxLength={20}
          />

          {/* 아이콘 */}
          <ThemedText type="smallBold" style={styles.label}>
            아이콘
          </ThemedText>
          <HScroller
            label="아이콘"
            contentContainerStyle={styles.emojiRow}
            // 수정할 때는 지금 아이콘이 보이도록 (칸 48 + 간격 8)
            initialCenterX={
              editing?.emoji && CategoryEmojis.includes(editing.emoji)
                ? CategoryEmojis.indexOf(editing.emoji) * 56 + 24
                : undefined
            }>
            {CategoryEmojis.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                role="button"
                aria-label={`아이콘 ${e}`}
                style={[
                  styles.emojiCell,
                  {
                    backgroundColor:
                      e === emoji ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: e === emoji ? color : 'transparent',
                  },
                ]}>
                <ThemedText style={styles.emoji}>{e}</ThemedText>
              </Pressable>
            ))}
          </HScroller>

          {/* 색상 */}
          <ThemedText type="smallBold" style={styles.label}>
            색상
          </ThemedText>
          <View style={styles.colorRow}>
            {CategoryColors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorCell,
                  { backgroundColor: c, borderColor: c === color ? theme.text : 'transparent' },
                ]}
              />
            ))}
          </View>

          {/* 액션 */}
          <PrimaryButton
            label={editing ? '저장' : '추가'}
            onPress={() => onSubmit(name, emoji, color)}
            disabled={!canSubmit}
            style={styles.submit}
          />
          {editing && onDelete && (
            <Pressable onPress={onDelete} style={styles.deleteButton}>
              <ThemedText type="small" style={{ color: '#EF4444' }}>
                {editing.parentId
                  ? '이 하위 분류함 삭제 (채널은 상위 분류함으로)'
                  : '이 분류함 삭제 (하위 분류함도 함께, 채널은 미분류로)'}
              </ThemedText>
            </Pressable>
          )}
          </ScrollView>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    maxHeight: '92%',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    flexShrink: 1,
  },
  scrollBody: { paddingBottom: Spacing.one },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9993',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing.three,
  },
  label: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  emojiCell: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emoji: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  submit: {
    marginTop: Spacing.four,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
});
