import Head from 'expo-router/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminLoginModal } from '@/components/admin/admin-login-modal';
import { AdminPanel } from '@/components/admin/admin-panel';
import { CategoryFormModal } from '@/components/category-form-modal';
import { HelpModal } from '@/components/help-modal';
import { PrivacyModal } from '@/components/privacy-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { YouTubeConnectModal } from '@/components/youtube-connect-modal';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/components/auth-provider';
import { authErrorMessage, setAccountPassword, signOut } from '@/services/auth';
import { checkPassword, checkPasswordConfirm } from '@/utils/signup-validation';
import { applyBackup, BACKUP_SUPPORTED, downloadBackup, pickBackup } from '@/services/backup';
import { pushChanges } from '@/services/cloud-sync';
import { useStore } from '@/store/store';
import { Category } from '@/types';
import { Backup, BackupError, describeBackup } from '@/utils/backup-format';
import { timeAgo } from '@/utils/format';

export default function SettingsScreen() {
  const theme = useTheme();
  const safeArea = useSafeAreaInsets();

  const categories = useStore((s) => s.categories);
  const channels = useStore((s) => s.channels);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const importDemoChannels = useStore((s) => s.importDemoChannels);
  const clearChannels = useStore((s) => s.clearChannels);
  const resetAll = useStore((s) => s.resetAll);
  const youtubeConnected = useStore((s) => s.youtubeConnected);
  const openLanding = useStore((s) => s.openLanding);
  const syncStatus = useStore((s) => s.syncStatus);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const syncError = useStore((s) => s.syncError);
  const { configured, session, profile } = useAuth();
  const [accountNote, setAccountNote] = useState('');
  // 전체 초기화는 되돌릴 수 없어 두 번 눌러야 실행된다 (4초 안에 한 번 더).
  // 실수로 빠르게 두 번 탭한 것은 무시하도록, 두 번째 누름은 0.6초가 지난 뒤에만 받는다.
  const [resetArmed, setResetArmed] = useState(false);
  const armedAt = useRef(0);
  useEffect(() => {
    if (!resetArmed) return;
    const t = setTimeout(() => setResetArmed(false), 4000);
    return () => clearTimeout(t);
  }, [resetArmed]);
  const onReset = () => {
    if (!resetArmed) {
      armedAt.current = Date.now();
      setResetArmed(true);
      return;
    }
    if (Date.now() - armedAt.current < 600) return;
    setResetArmed(false);
    resetAll();
  };

  // 내 분류 내보내기·가져오기 (웹)
  const [canFile, setCanFile] = useState(false);
  useEffect(() => setCanFile(BACKUP_SUPPORTED && typeof document !== 'undefined'), []);
  const [pendingImport, setPendingImport] = useState<Backup | null>(null);
  const [dataNote, setDataNote] = useState('');
  const [dataNoteIsError, setDataNoteIsError] = useState(false);
  const showDataNote = (text: string, isError = false) => {
    setDataNote(text);
    setDataNoteIsError(isError);
  };
  const onExport = () => {
    try {
      const count = downloadBackup();
      showDataNote(`채널 ${count}개를 파일로 저장했어요 (다운로드 폴더).`);
    } catch (e) {
      showDataNote(e instanceof Error ? e.message : String(e), true);
    }
  };
  const onPickImport = async () => {
    try {
      const b = await pickBackup();
      if (b) {
        setPendingImport(b);
        setDataNote('');
      }
    } catch (e) {
      setPendingImport(null);
      showDataNote(e instanceof BackupError ? e.message : '파일을 읽지 못했어요.', true);
    }
  };
  const onConfirmImport = async () => {
    if (!pendingImport) return;
    const summary = describeBackup(pendingImport);
    applyBackup(pendingImport);
    setPendingImport(null);
    if (!session) {
      // 로그아웃 상태에서 가져온 내용이 다음 로그인 때 클라우드 내용에 덮이지 않고 합쳐지도록.
      useStore.setState({ syncedUserId: null });
      showDataNote(`가져왔어요 · ${summary}`);
      return;
    }
    // 로그인 중이면 바로 계정에 올려 다른 기기에도 반영한다.
    showDataNote(`가져왔어요 · ${summary} · 계정에 올리는 중…`);
    try {
      await pushChanges(session.user.id);
      showDataNote(`가져왔어요 · ${summary} · 계정에도 저장했어요`);
    } catch (e) {
      showDataNote(`가져왔지만 계정에 올리지 못했어요: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  };

  const syncNow = async () => {
    if (!session) return;
    const { setSyncState } = useStore.getState();
    setSyncState({ syncStatus: 'syncing' });
    try {
      await pushChanges(session.user.id);
      setSyncState({ syncStatus: 'synced', lastSyncedAt: Date.now(), syncError: '' });
    } catch (e) {
      setSyncState({ syncStatus: 'error', syncError: e instanceof Error ? e.message : String(e) });
    }
  };
  // 계정 비밀번호 설정 (Google 가입 계정도) — Orca 처럼 Google 창이 안 뜨는 곳에서 이메일로 로그인하려고.
  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwNote, setPwNote] = useState<{ ok?: string; error?: string }>({});
  const savePassword = async () => {
    const err = checkPassword(pw1) ?? checkPasswordConfirm(pw1, pw2);
    if (err) {
      setPwNote({ error: err });
      return;
    }
    try {
      await setAccountPassword(pw1);
      setPw1('');
      setPw2('');
      setPwOpen(false);
      setPwNote({
        ok: `비밀번호를 정했어요. 이제 Orca 같은 앱 안 화면에서도 ${session?.user.email ?? '이메일'} + 이 비밀번호로 로그인할 수 있어요.`,
      });
    } catch (e) {
      setPwNote({ error: authErrorMessage(e) });
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setAccountNote('로그아웃했어요. 이 기기의 분류는 그대로 남아 있어요.');
    } catch (e) {
      setAccountNote(e instanceof Error ? e.message : String(e));
    }
  };
  const memberName = profile?.full_name || profile?.display_name || session?.user.email || '회원';
  const memberSub = [profile?.username ? `@${profile.username}` : null, session?.user.email ?? profile?.email]
    .filter(Boolean)
    .join(' · ');
  const syncLabel =
    syncStatus === 'syncing'
      ? '동기화 중…'
      : syncStatus === 'error'
        ? `동기화 오류: ${syncError}`
        : lastSyncedAt
          ? `동기화됨 · ${timeAgo(new Date(lastSyncedAt).toISOString())}`
          : '동기화 대기';

  // 관리자: 서버에 등록된 관리자 계정(서버 연결 전에는 이 기기 주인)만 '관리자 로그인'이 보인다.
  const isAdmin = configured ? !!session && profile?.role === 'admin' : true;
  const [adminLoginVisible, setAdminLoginVisible] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  const openAdmin = () => {
    if (useStore.getState().adminUnlockedUntil > Date.now()) setAdminVisible(true);
    else setAdminLoginVisible(true);
  };

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [ytVisible, setYtVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  // 구독 화면의 ⏰ 에서 로그인이 필요하다고 보내면 유튜브 연결 창을 바로 연다.
  const connectRequested = useStore((s) => s.connectRequested);
  const setConnectRequested = useStore((s) => s.setConnectRequested);
  useEffect(() => {
    if (!connectRequested) return;
    setYtVisible(true);
    setConnectRequested(false);
  }, [connectRequested, setConnectRequested]);

  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const ch of channels) {
      if (ch.categoryId) m.set(ch.categoryId, (m.get(ch.categoryId) ?? 0) + 1);
    }
    return m;
  }, [channels]);

  // 상위 분류함 순서대로, 각각의 하위 분류함을 함께 묶는다.
  const tree = useMemo(() => {
    const byOrder = (a: Category, b: Category) => a.order - b.order;
    return categories
      .filter((c) => !c.parentId)
      .sort(byOrder)
      .map((top) => ({ top, subs: categories.filter((c) => c.parentId === top.id).sort(byOrder) }));
  }, [categories]);

  /** 새 분류함을 만들 상위 분류함 id (null 이면 최상위). */
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const openAdd = (parentId: string | null = null) => {
    setEditing(null);
    setAddParentId(parentId);
    setFormVisible(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormVisible(true);
  };
  const handleSubmit = (name: string, emoji: string, color: string) => {
    if (editing) updateCategory(editing.id, { name, emoji, color });
    else addCategory(name, emoji, color, addParentId);
    setFormVisible(false);
  };
  const handleDelete = () => {
    if (editing) deleteCategory(editing.id);
    setFormVisible(false);
  };

  const topPad = Platform.OS === 'web' ? 80 : safeArea.top + Spacing.three;
  const bottomPad = safeArea.bottom + BottomTabInset + Spacing.four;

  return (
    <ThemedView style={styles.container}>
      <Head>
        <title>설정 · 마이 튜브</title>
      </Head>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={styles.inner}>
          <ThemedText type="subtitle">설정</ThemedText>

          {/* 계정 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            계정
          </ThemedText>
          <View style={styles.group}>
            {session ? (
              <>
                <Row>
                  <View style={[styles.avatar, { backgroundColor: '#ff9fd8' }]}>
                    <ThemedText style={styles.avatarText}>{memberName.charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.rowLabel}>
                    <View style={styles.nameRow}>
                      <ThemedText type="default">{memberName}</ThemedText>
                      {profile?.role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <ThemedText type="small" style={styles.adminBadgeText}>
                            관리자
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    {memberSub ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {memberSub}
                      </ThemedText>
                    ) : null}
                  </View>
                </Row>
                <Row onPress={syncNow} divider>
                  <ThemedText style={styles.actionEmoji}>☁️</ThemedText>
                  <View style={styles.rowLabel}>
                    <ThemedText type="default">지금 동기화</ThemedText>
                    <ThemedText
                      type="small"
                      themeColor={syncStatus === 'error' ? undefined : 'textSecondary'}
                      style={syncStatus === 'error' ? { color: '#EF4444' } : undefined}>
                      {syncLabel}
                    </ThemedText>
                  </View>
                </Row>
                <Row onPress={() => setPwOpen((v) => !v)} divider>
                  <ThemedText style={styles.actionEmoji}>🔑</ThemedText>
                  <View style={styles.rowLabel}>
                    <ThemedText type="default">비밀번호 설정</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Google 창이 안 뜨는 곳(Orca 같은 앱 안 화면 등)에서 이메일 + 비밀번호로 로그인할 때 써요.
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                    {pwOpen ? '˅' : '›'}
                  </ThemedText>
                </Row>
                {pwOpen && (
                  <View style={[styles.pwBox, { backgroundColor: theme.backgroundElement }]}>
                    <TextInput
                      value={pw1}
                      onChangeText={setPw1}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="새 비밀번호 (영문+숫자 8자 이상)"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.pwInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
                    />
                    <TextInput
                      value={pw2}
                      onChangeText={setPw2}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="한 번 더"
                      placeholderTextColor={theme.textSecondary}
                      onSubmitEditing={savePassword}
                      style={[styles.pwInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
                    />
                    <Pressable onPress={savePassword} role="button" aria-label="비밀번호 저장" style={styles.pwSave}>
                      <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                        저장
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
                {pwNote.ok || pwNote.error ? (
                  <ThemedText type="small" style={[styles.hint, { color: pwNote.error ? '#EF4444' : '#16a34a' }]}>
                    {pwNote.error ?? pwNote.ok}
                  </ThemedText>
                ) : null}
                <Row onPress={logout} divider>
                  <ThemedText style={styles.actionEmoji}>🚪</ThemedText>
                  <ThemedText type="default" style={[styles.rowLabel, { color: '#EF4444' }]}>
                    로그아웃
                  </ThemedText>
                </Row>
              </>
            ) : (
              <Row onPress={() => openLanding('login')}>
                <ThemedText style={styles.actionEmoji}>🔐</ThemedText>
                <View style={styles.rowLabel}>
                  <ThemedText type="default">로그인 / 회원가입</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {configured
                      ? '가입하면 분류함·채널·알림 설정이 계정에 저장돼 어느 기기에서든 이어져요.'
                      : '서버 연결 설정 전이라 지금은 이 기기에만 저장돼요.'}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                  ›
                </ThemedText>
              </Row>
            )}
            {isAdmin && (
              <Row onPress={openAdmin} divider>
                <ThemedText style={styles.actionEmoji}>🛡️</ThemedText>
                <View style={styles.rowLabel}>
                  <ThemedText type="default">관리자 로그인</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    관리자 비밀번호를 한 번 더 입력하면 관리자 페이지가 열려요.
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                  ›
                </ThemedText>
              </Row>
            )}
            <Row onPress={() => openLanding('home')} divider>
              <ThemedText style={styles.actionEmoji}>✨</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                마이 튜브 소개 페이지 보기
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                ›
              </ThemedText>
            </Row>
          </View>
          {accountNote ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              {accountNote}
            </ThemedText>
          ) : null}

          {/* 시작하기: 연결 & 도움말 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            시작하기
          </ThemedText>
          <View style={styles.group}>
            <Row onPress={() => setYtVisible(true)}>
              <ThemedText style={styles.actionEmoji}>🔗</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                YouTube 계정 연결
              </ThemedText>
              <ThemedText type="small" themeColor={youtubeConnected ? 'text' : 'textSecondary'}>
                {youtubeConnected ? '연결됨' : '연결 안 됨'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                ›
              </ThemedText>
            </Row>
            <Row onPress={() => setHelpVisible(true)} divider>
              <ThemedText style={styles.actionEmoji}>❓</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                도움말 (사용법 보기)
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                ›
              </ThemedText>
            </Row>
          </View>

          {/* 분류함 관리 */}
          <View style={styles.sectionHead}>
            <ThemedText type="smallBold">분류함</ThemedText>
            <Pressable onPress={() => openAdd(null)} hitSlop={8}>
              <ThemedText type="small" style={{ color: '#FF0033' }}>
                + 추가
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.group}>
            {tree.map(({ top, subs }, i) => (
              <View key={top.id}>
                <Row onPress={() => openEdit(top)} divider={i > 0}>
                  <View style={[styles.dot, { backgroundColor: top.color }]}>
                    <ThemedText style={styles.dotEmoji}>{top.emoji}</ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.rowLabel}>
                    {top.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {(countByCat.get(top.id) ?? 0) +
                      subs.reduce((n, sub) => n + (countByCat.get(sub.id) ?? 0), 0)}
                    개
                  </ThemedText>
                  <Pressable
                    onPress={() => openAdd(top.id)}
                    hitSlop={6}
                    role="button"
                    aria-label={`${top.name}에 하위 분류함 추가`}
                    style={[styles.subAddPill, { borderColor: theme.backgroundSelected }]}>
                    <ThemedText type="small" style={styles.subAddText}>
                      + 하위
                    </ThemedText>
                  </Pressable>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                    ›
                  </ThemedText>
                </Row>
                {subs.map((sub) => (
                  <Row key={sub.id} onPress={() => openEdit(sub)} divider>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.subIndent}>
                      └
                    </ThemedText>
                    <View style={[styles.subDot, { backgroundColor: sub.color }]} />
                    <ThemedText type="small" style={styles.rowLabel}>
                      {sub.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {countByCat.get(sub.id) ?? 0}개
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                      ›
                    </ThemedText>
                  </Row>
                ))}
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            분류함을 눌러 이름·아이콘·색상을 바꾸거나 삭제할 수 있어요. "+ 하위"로 하위 분류함을 만들어요.
            분류함을 지우면 그 안의 채널은 미분류로 가요 (상위를 지우면 하위도 함께 지워져요). 구독 화면 목록 위의 "분류함 삭제"로도 지울 수 있어요.
          </ThemedText>

          {/* 데이터 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            데이터
          </ThemedText>
          <View style={styles.group}>
            {canFile && (
              <>
                <Row onPress={onExport}>
                  <ThemedText style={styles.actionEmoji}>📤</ThemedText>
                  <ThemedText type="default" style={styles.rowLabel}>
                    내 분류 내보내기 (파일로 저장)
                  </ThemedText>
                </Row>
                <Row onPress={onPickImport} divider>
                  <ThemedText style={styles.actionEmoji}>📥</ThemedText>
                  <ThemedText type="default" style={styles.rowLabel}>
                    내 분류 가져오기 (내보낸 파일 열기)
                  </ThemedText>
                </Row>
                {pendingImport && (
                  <View style={[styles.importConfirm, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="smallBold">이 파일로 바꿀까요?</ThemedText>
                    <ThemedText type="small">{describeBackup(pendingImport)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {session
                        ? '로그인한 계정(모든 기기)의 분류함·채널·알림이 파일 내용으로 바뀌어요. YouTube 연결 정보는 그대로예요.'
                        : '지금 이 기기의 분류함·채널·알림이 파일 내용으로 바뀌어요. YouTube 연결 정보는 그대로예요.'}
                    </ThemedText>
                    <View style={styles.importButtons}>
                      <Pressable
                        onPress={() => setPendingImport(null)}
                        role="button"
                        aria-label="가져오기 취소"
                        style={[styles.importBtn, { borderColor: theme.backgroundSelected }]}>
                        <ThemedText type="small">취소</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={onConfirmImport}
                        role="button"
                        aria-label="파일 내용으로 바꾸기"
                        style={[styles.importBtn, styles.importBtnPrimary]}>
                        <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                          바꾸기
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
            <Row onPress={importDemoChannels} divider={canFile}>
              <ThemedText style={styles.actionEmoji}>🔄</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                데모 채널 다시 불러오기
              </ThemedText>
            </Row>
            <Row onPress={clearChannels} divider>
              <ThemedText style={styles.actionEmoji}>🧹</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                채널 목록 비우기
              </ThemedText>
            </Row>
            <Row onPress={onReset} divider>
              <ThemedText style={styles.actionEmoji}>⚠️</ThemedText>
              <ThemedText type="default" style={[styles.rowLabel, { color: '#EF4444' }]}>
                {resetArmed
                  ? '한 번 더 누르면 분류함·채널·알림·YouTube 연결 정보가 모두 지워져요'
                  : '전체 초기화 (분류함·채널·YouTube 연결 정보까지)'}
              </ThemedText>
            </Row>
          </View>
          {dataNote ? (
            <ThemedText type="small" style={[styles.hint, { color: dataNoteIsError ? '#EF4444' : '#0b8a4b' }]}>
              {dataNote}
            </ThemedText>
          ) : null}
          {canFile && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              다른 주소·기기로 옮길 때: 원래 쓰던 곳에서 "내보내기" → 새 곳에서 "가져오기". 파일에는 로그인
              정보·API 키가 들어가지 않아요.
            </ThemedText>
          )}

          {/* 곧 추가될 기능 (로드맵) */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            곧 추가될 기능
          </ThemedText>
          <View style={styles.group}>
            <ComingSoon emoji="🔔" title="새 영상 알림" desc="구독 채널에 새 영상이 올라오면 푸시 알림" first />
            <ComingSoon emoji="📝" title="노션에 요약" desc="영상 핵심 내용을 AI로 요약해 Notion에 저장" />
            <ComingSoon emoji="💬" title="카카오톡·SNS 공유" desc="마음에 드는 영상을 친구에게 공유" />
          </View>

          {/* 정보 */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            정보
          </ThemedText>
          <View style={styles.group}>
            <Row onPress={() => setPrivacyVisible(true)}>
              <ThemedText style={styles.actionEmoji}>🔒</ThemedText>
              <ThemedText type="default" style={styles.rowLabel}>
                개인정보처리방침
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chevron}>
                ›
              </ThemedText>
            </Row>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
            마이 튜브 v1.0 · Phase 2 (유튜브 연동){'\n'}만든 채널과 분류는 이 기기에 저장됩니다.
          </ThemedText>
        </View>
      </ScrollView>

      <CategoryFormModal
        visible={formVisible}
        editing={editing}
        parentName={!editing && addParentId ? categories.find((c) => c.id === addParentId)?.name : undefined}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
        onClose={() => setFormVisible(false)}
      />
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <YouTubeConnectModal visible={ytVisible} onClose={() => setYtVisible(false)} />
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <AdminLoginModal
        visible={adminLoginVisible}
        onClose={() => setAdminLoginVisible(false)}
        onSuccess={() => {
          setAdminLoginVisible(false);
          setAdminVisible(true);
        }}
        accountLabel={session?.user.email ?? (configured ? memberName : '이 기기 관리자')}
      />
      {adminVisible && <AdminPanel visible onClose={() => setAdminVisible(false)} />}
    </ThemedView>
  );
}

function Row({
  children,
  onPress,
  divider,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.background },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}>
      {children}
    </Pressable>
  );
}

function ComingSoon({
  emoji,
  title,
  desc,
  first,
}: {
  emoji: string;
  title: string;
  desc: string;
  first?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement },
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.background },
      ]}>
      <ThemedText style={[styles.actionEmoji, { opacity: 0.5 }]}>{emoji}</ThemedText>
      <View style={styles.rowLabel}>
        <ThemedText type="small" themeColor="textSecondary">
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ opacity: 0.7 }}>
          {desc}
        </ThemedText>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.badgeText}>
          준비중
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.two },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
  },
  sectionTitle: { marginTop: Spacing.five, marginBottom: Spacing.one },
  group: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: 'transparent',
  },
  rowLabel: { flex: 1 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotEmoji: { fontSize: 16 },
  actionEmoji: { fontSize: 20, width: 32, textAlign: 'center' },
  chevron: { fontSize: 20, marginLeft: Spacing.one },
  subAddPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: Spacing.one,
  },
  subAddText: { color: '#7c3aed', fontWeight: '700' },
  subIndent: { width: 32, textAlign: 'right' },
  subDot: { width: 12, height: 12, borderRadius: 6 },
  hint: { marginTop: Spacing.two, paddingHorizontal: Spacing.one },
  pwBox: { padding: Spacing.three, gap: Spacing.two },
  pwInput: { borderWidth: 1, borderRadius: 10, height: 42, paddingHorizontal: 12, fontSize: 15 },
  pwSave: { backgroundColor: '#1b2c9e', borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  adminBadge: { backgroundColor: '#1b2c9e', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  adminBadgeText: { color: '#ffffff', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  importConfirm: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#9993',
  },
  importButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two },
  importBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  importBtnPrimary: { backgroundColor: '#ff0033', borderColor: '#ff0033' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#1b2c9e' },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.five,
  },
  badgeText: { fontSize: 11 },
  footer: { marginTop: Spacing.five, textAlign: 'center', lineHeight: 20 },
});
