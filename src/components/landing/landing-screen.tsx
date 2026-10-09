import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { GoogleButton } from '@/components/landing/google-button';
import { LoginForm } from '@/components/landing/login-form';
import { SignUpForm } from '@/components/landing/signup-form';
import { PrivacyModal } from '@/components/privacy-modal';
import { useTheme } from '@/hooks/use-theme';
import { authErrorMessage, signInWithGoogle } from '@/services/auth';
import { NotConfiguredError } from '@/services/supabase';

const RED = '#ff0033';
const PINK = '#ff9fd8';
const NAVY = '#1b2c9e';
const BASELINE = ['#8B5CF6', '#EC4899', '#F97316'] as const;

export type LandingMode = 'home' | 'login' | 'signup';

interface Props {
  onEnter: () => void;
  initialMode?: LandingMode;
}

/** 탭별 실제 고화질 비주얼 콘텐츠 데이터 */
const PREVIEW_TABS = [
  {
    id: 'tech',
    label: '테크·AI',
    emoji: '🤖',
    color: '#8B5CF6',
    channel: '테크 트렌드 랩',
    subs: '구독자 45만',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    title: '차세대 AI 코딩 자동화와 LLM 실전 가이드',
    heroImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    recentThumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'study',
    label: '영어·공부',
    emoji: '📚',
    color: '#10B981',
    channel: '원어민 5분 영어',
    subs: '구독자 120만',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    title: '원어민이 일상에서 가장 많이 쓰는 실전 표현 10가지',
    heroImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    recentThumb: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'travel',
    label: '여행·힐링',
    emoji: '✈️',
    color: '#EC4899',
    channel: '배낭 하나로 세계일주',
    subs: '구독자 88만',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    title: '스위스 알프스 기차 여행, 현지인만 아는 비밀 뷰포인트',
    heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
    recentThumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'music',
    label: '음악·공연',
    emoji: '🎵',
    color: '#3B82F6',
    channel: '비트 앤 라운지',
    subs: '구독자 62만',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    title: '집중할 때 듣는 감성 로파이(Lo-Fi) 라이브 믹스',
    heroImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    recentThumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
  },
];

/** 세련되고 시각적인 비주얼 중심 랜딩 페이지 */
export function LandingScreen({ onEnter, initialMode = 'home' }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const { configured } = useAuth();
  const [mode, setMode] = useState<LandingMode>(initialMode);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(PREVIEW_TABS[0]);
  const [googleError, setGoogleError] = useState('');

  const google = async () => {
    setGoogleError('');
    if (!configured) {
      setGoogleError(new NotConfiguredError().message);
      return;
    }
    try {
      await signInWithGoogle();
    } catch (e) {
      setGoogleError(authErrorMessage(e));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (isMobile ? 4 : 8),
          paddingBottom: insets.bottom + (isMobile ? 40 : 60),
        }}
        showsVerticalScrollIndicator={false}>
        {/* 1. 심플 상단 네비게이션 */}
        <View style={[styles.navWrapper, isMobile && { paddingHorizontal: 12, marginBottom: 10 }]}>
          <View style={[styles.navBar, isMobile && { paddingVertical: 8 }]}>
            <Pressable onPress={() => setMode('home')} style={styles.brandGroup}>
              <View style={[styles.logoPill, isMobile && { width: 40, height: 40 }]}>
                <ExpoImage
                  source={require('@/assets/images/mascot.webp')}
                  style={[styles.logoMascot, isMobile && { width: 40, height: 40 }]}
                  contentFit="contain"
                />
              </View>
              <ExpoImage
                source={require('@/assets/images/brand-logo.png')}
                style={[styles.brandLogo, isMobile && { width: 82, height: 33 }]}
                contentFit="contain"
                accessibilityLabel="마이 튜브"
              />
            </Pressable>

            <View style={[styles.navActions, isMobile && { gap: 6 }]}>
              <Pressable
                onPress={() => setMode('login')}
                style={[styles.navGhostBtn, isMobile && { paddingHorizontal: 6, paddingVertical: 6 }]}>
                <Text style={[styles.navGhostBtnText, { color: theme.text }, isMobile && { fontSize: 13 }]}>
                  로그인
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('signup')}
                style={[
                  styles.navPrimaryBtn,
                  isMobile && { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 10 },
                ]}>
                <Text style={[styles.navPrimaryBtnText, isMobile && { fontSize: 13 }]}>시작하기</Text>
              </Pressable>
              <Pressable
                onPress={onEnter}
                style={[styles.navSkipBtn, isMobile && { paddingHorizontal: 4, paddingVertical: 6 }]}>
                <Text style={[styles.navSkipBtnText, isMobile && { fontSize: 12 }]}>둘러보기 ✕</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {mode !== 'home' ? (
          <View style={[styles.authContainer, isMobile && { paddingHorizontal: 12 }]}>
            <View
              style={[
                styles.authCard,
                { backgroundColor: theme.backgroundElement },
                isMobile && { padding: 18, borderRadius: 18 },
              ]}>
              {mode === 'login' ? (
                <LoginForm onDone={onEnter} onBack={() => setMode('home')} onGoSignup={() => setMode('signup')} />
              ) : (
                <SignUpForm onDone={onEnter} onBack={() => setMode('home')} onGoLogin={() => setMode('login')} />
              )}
            </View>
          </View>
        ) : (
          <>
            {/* 2. 히어로 섹션 (간결한 카피 + 대형 비주얼 목업) */}
            <View style={[styles.heroSection, isMobile && { paddingHorizontal: 12, marginTop: 4, marginBottom: 24 }]}>
              <View style={[styles.heroHeader, isMobile && { gap: 12, marginBottom: 20 }]}>
                <View style={[styles.heroBadge, isMobile && { paddingHorizontal: 10, paddingVertical: 4 }]}>
                  <Text style={[styles.heroBadgeText, isMobile && { fontSize: 11 }]}>⚡ 스마트 유튜브 구독 서재</Text>
                </View>
                <Text
                  style={[
                    styles.heroHeadline,
                    { color: theme.text },
                    {
                      fontSize: isMobile ? 26 : isTablet ? 34 : 44,
                      lineHeight: isMobile ? 36 : isTablet ? 44 : 54,
                    },
                  ]}>
                  내 유튜브 구독함,{'\n'}
                  <Text style={{ color: RED }}>폴더로 깔끔하게</Text> 정리하세요
                </Text>
                <Text
                  style={[
                    styles.heroSubtitle,
                    { color: theme.textSecondary },
                    {
                      fontSize: isMobile ? 14 : 17,
                      lineHeight: isMobile ? 22 : 26,
                    },
                  ]}>
                  원하는 카테고리만 쏙쏙. 알고리즘에 휘둘리지 않고 내 시청 시간에 맞춰 쾌적하게.
                </Text>

                {/* 메인 액션 버튼 */}
                <View style={[styles.heroCtas, isMobile && { gap: 8, width: '100%' }]}>
                  <Pressable
                    onPress={() => setMode('signup')}
                    style={({ pressed }) => [
                      styles.mainCtaBtn,
                      isMobile && { flex: 1, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.mainCtaText, isMobile && { fontSize: 14 }]}>무료 시작하기 →</Text>
                  </Pressable>
                  <Pressable
                    onPress={onEnter}
                    style={({ pressed }) => [
                      styles.secondaryCtaBtn,
                      { backgroundColor: theme.backgroundElement },
                      isMobile && { flex: 1, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.secondaryCtaText, { color: theme.text }, isMobile && { fontSize: 14 }]}>
                      데모 둘러보기
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 3. 대형 인터랙티브 비주얼 쇼케이스 */}
              <View
                style={[
                  styles.showcaseFrame,
                  { backgroundColor: theme.backgroundElement },
                  isMobile && { padding: 10, borderRadius: 16 },
                ]}>
                {/* 상단 탭 스위처 */}
                <View style={[styles.switcherBar, isMobile && { gap: 8, marginBottom: 12 }]}>
                  <Text style={[styles.switcherHelp, isMobile && { fontSize: 12 }]}>
                    탭을 눌러 카테고리를 확인해 보세요 👇
                  </Text>
                  <View style={[styles.tabButtonsRow, isMobile && { gap: 6 }]}>
                    {PREVIEW_TABS.map((t) => {
                      const selected = t.id === activeTab.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setActiveTab(t)}
                          style={[
                            styles.previewTabBtn,
                            isMobile && { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
                            selected && { backgroundColor: t.color, transform: [{ scale: 1.04 }] },
                          ]}>
                          <Text
                            style={[
                              styles.previewTabBtnText,
                              isMobile && { fontSize: 12 },
                              selected && { color: '#fff', fontWeight: '800' },
                            ]}>
                            {t.emoji} {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 선택된 카테고리의 생생한 앱 목업 카드 */}
                <View style={[styles.mockupCanvas, { backgroundColor: theme.background }]}>
                  {/* 대형 영상 썸네일 & 재생 버튼 */}
                  <View
                    style={[
                      styles.mainThumbWrapper,
                      { height: isMobile ? 190 : isTablet ? 260 : 340 },
                    ]}>
                    <Image source={{ uri: activeTab.heroImage }} style={styles.mainThumbImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={[styles.mainThumbOverlay, isMobile && { padding: 14, gap: 4 }]}>
                      <View style={[styles.badgeNew, isMobile && { paddingHorizontal: 6, paddingVertical: 2 }]}>
                        <Text style={[styles.badgeNewText, isMobile && { fontSize: 9 }]}>신규 영상 NEW</Text>
                      </View>
                      <Text
                        style={[
                          styles.mainThumbTitle,
                          {
                            fontSize: isMobile ? 14 : 20,
                            lineHeight: isMobile ? 20 : 28,
                          },
                        ]}
                        numberOfLines={2}>
                        {activeTab.title}
                      </Text>
                    </LinearGradient>
                    <View
                      style={[
                        styles.playCenterBtn,
                        isMobile && {
                          width: 42,
                          height: 42,
                          marginLeft: -21,
                          marginTop: -21,
                          borderRadius: 21,
                        },
                      ]}>
                      <MaterialCommunityIcons name="play" size={isMobile ? 24 : 32} color="#fff" />
                    </View>
                  </View>

                  {/* 채널 정보 및 썸네일 스트립 */}
                  <View style={[styles.mockupFooter, isMobile && { padding: 12, gap: 10 }]}>
                    <View style={styles.channelRow}>
                      <Image
                        source={{ uri: activeTab.avatar }}
                        style={[styles.channelAvatar, isMobile && { width: 36, height: 36, borderRadius: 18 }]}
                      />
                      <View style={styles.channelInfo}>
                        <Text style={[styles.channelTitle, { color: theme.text }, isMobile && { fontSize: 14 }]}>
                          {activeTab.channel}
                        </Text>
                        <Text style={[styles.channelSubs, { color: theme.textSecondary }, isMobile && { fontSize: 11 }]}>
                          {activeTab.subs}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.folderBadge,
                          { backgroundColor: activeTab.color + '22' },
                          isMobile && { paddingHorizontal: 8, paddingVertical: 4 },
                        ]}>
                        <Text style={[styles.folderBadgeText, { color: activeTab.color }, isMobile && { fontSize: 11 }]}>
                          {activeTab.emoji} {activeTab.label}
                        </Text>
                      </View>
                    </View>

                    {/* 최근 영상 서브 썸네일 & 알림 */}
                    <View
                      style={[
                        styles.subThumbsRow,
                        isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 8 },
                      ]}>
                      <View style={styles.subThumbItem}>
                        <Image
                          source={{ uri: activeTab.recentThumb }}
                          style={[styles.subThumbImg, isMobile && { width: 50, height: 32 }]}
                        />
                        <Text style={[styles.subThumbTime, { color: theme.textSecondary }, isMobile && { fontSize: 11 }]}>
                          어제 업로드된 영상
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.alertPillMock,
                          { backgroundColor: theme.backgroundElement },
                          isMobile && { paddingHorizontal: 10, paddingVertical: 6 },
                        ]}>
                        <MaterialCommunityIcons name="alarm-check" size={16} color="#10B981" />
                        <Text style={[styles.alertPillText, { color: theme.text }, isMobile && { fontSize: 11 }]}>
                          매일 저녁 9시 볼 시간 알림 예약됨
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. 그림으로 보는 핵심 기능 3선 */}
            <View style={[styles.sectionContainer, isMobile && { paddingHorizontal: 12, marginTop: 40 }]}>
              <View style={[styles.sectionHeaderCentered, isMobile && { marginBottom: 20 }]}>
                <Text style={styles.sectionPill}>FEATURES</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }, isMobile && { fontSize: 22 }]}>
                  한눈에 이해하는 마이 튜브
                </Text>
              </View>

              <View style={[styles.cardGrid, isDesktop && styles.cardGridWide, isMobile && { gap: 14 }]}>
                {/* 카드 1: 폴더 분류 */}
                <View
                  style={[
                    styles.featureVisualCard,
                    { backgroundColor: theme.backgroundElement },
                    isDesktop && { flex: 1 },
                  ]}>
                  <View style={[styles.cardImageHolder, isMobile && { height: 140 }]}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80' }}
                      style={styles.cardImg}
                    />
                    <View style={styles.cardOverlayTag}>
                      <Text style={styles.cardOverlayTagText}>📂 내 맘대로 폴더</Text>
                    </View>
                  </View>
                  <View style={[styles.cardBody, isMobile && { padding: 16 }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }, isMobile && { fontSize: 16 }]}>
                      카테고리별 쏙쏙 분류
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }, isMobile && { fontSize: 13, lineHeight: 20 }]}>
                      공부, 개발, 힐링, 음악 등 원하는 폴더를 만들면 채널들이 깔끔하게 정렬돼요.
                    </Text>
                  </View>
                </View>

                {/* 카드 2: 썸네일 스트립 & 새 영상 */}
                <View
                  style={[
                    styles.featureVisualCard,
                    { backgroundColor: theme.backgroundElement },
                    isDesktop && { flex: 1 },
                  ]}>
                  <View style={[styles.cardImageHolder, isMobile && { height: 140 }]}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80' }}
                      style={styles.cardImg}
                    />
                    <View style={[styles.cardOverlayTag, { backgroundColor: RED }]}>
                      <Text style={styles.cardOverlayTagText}>🔥 실시간 NEW 캐치</Text>
                    </View>
                  </View>
                  <View style={[styles.cardBody, isMobile && { padding: 16 }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }, isMobile && { fontSize: 16 }]}>
                      썸네일로 바로 확인
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }, isMobile && { fontSize: 13, lineHeight: 20 }]}>
                      채널마다 새로 올라온 영상을 썸네일 스트립으로 확인하고 원클릭으로 바로 시청해요.
                    </Text>
                  </View>
                </View>

                {/* 카드 3: 시간 맞춤 알림 */}
                <View
                  style={[
                    styles.featureVisualCard,
                    { backgroundColor: theme.backgroundElement },
                    isDesktop && { flex: 1 },
                  ]}>
                  <View style={[styles.cardImageHolder, isMobile && { height: 140 }]}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=80' }}
                      style={styles.cardImg}
                    />
                    <View style={[styles.cardOverlayTag, { backgroundColor: NAVY }]}>
                      <Text style={styles.cardOverlayTagText}>⏰ 스마트 볼 시간</Text>
                    </View>
                  </View>
                  <View style={[styles.cardBody, isMobile && { padding: 16 }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }, isMobile && { fontSize: 16 }]}>
                      내가 정한 시청 시간
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }, isMobile && { fontSize: 13, lineHeight: 20 }]}>
                      퇴근길이나 주말 아침처럼, 내가 정한 시간에만 똑똑하게 알림을 받고 집중해요.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 5. Before & After 시각적 비교 */}
            <View style={[styles.sectionContainer, isMobile && { paddingHorizontal: 12, marginTop: 40 }]}>
              <View
                style={[
                  styles.compareBox,
                  isDesktop && styles.compareBoxWide,
                  isMobile && { gap: 8 },
                ]}>
                <View style={[styles.compareCol, { backgroundColor: '#F3F4F6' }, isMobile && { padding: 18 }]}>
                  <Text style={[styles.compareEmoji, isMobile && { fontSize: 32 }]}>😵‍💫</Text>
                  <Text style={[styles.compareHeading, isMobile && { fontSize: 17 }]}>기존 유튜브 구독함</Text>
                  <Text style={[styles.compareParagraph, isMobile && { fontSize: 13, lineHeight: 20 }]}>
                    수백 개 채널이 뒤죽박죽 섞여{'\n'}
                    알고리즘에 이끌려 1~2시간 낭비
                  </Text>
                </View>

                <View
                  style={[
                    styles.compareDivider,
                    isMobile && { width: 34, height: 34, borderRadius: 17 },
                  ]}>
                  <Text style={[styles.compareDividerText, isMobile && { fontSize: 11 }]}>VS</Text>
                </View>

                <View
                  style={[
                    styles.compareCol,
                    { backgroundColor: '#EFF6FF', borderColor: '#3B82F6', borderWidth: 2 },
                    isMobile && { padding: 18 },
                  ]}>
                  <Text style={[styles.compareEmoji, isMobile && { fontSize: 32 }]}>✨</Text>
                  <Text style={[styles.compareHeading, { color: '#1D4ED8' }, isMobile && { fontSize: 17 }]}>
                    마이 튜브 서재
                  </Text>
                  <Text style={[styles.compareParagraph, { color: '#1E3A8A' }, isMobile && { fontSize: 13, lineHeight: 20 }]}>
                    내가 만든 폴더에서 착착!{'\n'}
                    원하는 영상만 깔끔하고 알차게
                  </Text>
                </View>
              </View>
            </View>

            {/* 6. 하단 미니멀 배너 CTA */}
            <View style={[styles.sectionContainer, isMobile && { paddingHorizontal: 12, marginTop: 40 }]}>
              <LinearGradient
                colors={BASELINE}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.bottomBand, isMobile && { padding: 22, borderRadius: 18, gap: 10 }]}>
                <Text style={[styles.bottomBandTitle, isMobile && { fontSize: 20, lineHeight: 28 }]}>
                  구독 채널 정리를 지금 시작해 보세요
                </Text>
                <Text style={[styles.bottomBandSub, isMobile && { fontSize: 13 }]}>
                  가입 없이도 데모 데이터로 즉시 체험할 수 있어요.
                </Text>
                <View style={[styles.bottomBtnRow, isMobile && { flexDirection: 'column', width: '100%', gap: 8 }]}>
                  <Pressable
                    onPress={() => setMode('signup')}
                    style={[styles.bottomWhiteBtn, isMobile && { width: '100%', alignItems: 'center', paddingVertical: 12 }]}>
                    <Text style={styles.bottomWhiteBtnText}>1초 만에 무료 시작하기</Text>
                  </Pressable>
                  <Pressable
                    onPress={onEnter}
                    style={[styles.bottomOutlineBtn, isMobile && { width: '100%', alignItems: 'center', paddingVertical: 12 }]}>
                    <Text style={styles.bottomOutlineBtnText}>가입 없이 둘러보기 →</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>

            {/* 7. 심플 푸터 */}
            <View style={[styles.footerWrap, isMobile && { marginTop: 32, paddingHorizontal: 12 }]}>
              <View style={styles.footerLinks}>
                <Pressable onPress={() => setPrivacyOpen(true)}>
                  <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>개인정보처리방침</Text>
                </Pressable>
                <Text style={{ color: theme.textSecondary }}>·</Text>
                <Pressable onPress={() => setMode('login')}>
                  <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>로그인</Text>
                </Pressable>
              </View>
              <Text style={[styles.copyText, { color: theme.textSecondary }, isMobile && { fontSize: 11 }]}>
                © 2026 마이 튜브 · YouTube는 Google LLC의 상표이며, 마이 튜브는 독립된 서비스입니다.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <PrivacyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  navWrapper: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPill: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMascot: { width: 52, height: 52 },
  brandLogo: { width: 100, height: 40 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navGhostBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  navGhostBtnText: { fontSize: 14, fontWeight: '700' },
  navPrimaryBtn: {
    backgroundColor: RED,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navPrimaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  navSkipBtn: { paddingVertical: 8, paddingHorizontal: 10 },
  navSkipBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },

  // 히어로
  heroSection: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  heroHeader: {
    alignItems: 'center',
    maxWidth: 720,
    gap: 16,
    marginBottom: 36,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 0, 51, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 51, 0.18)',
  },
  heroBadgeText: { color: RED, fontSize: 13, fontWeight: '800' },
  heroHeadline: {
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroSubtitle: {
    textAlign: 'center',
    maxWidth: 540,
  },
  heroCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mainCtaBtn: {
    backgroundColor: RED,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    boxShadow: '0 6px 16px rgba(255, 0, 51, 0.3)',
    alignItems: 'center',
  },
  mainCtaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondaryCtaBtn: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryCtaText: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  // 쇼케이스 프레임
  showcaseFrame: {
    width: '100%',
    borderRadius: 24,
    padding: 16,
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
  },
  switcherBar: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  switcherHelp: { fontSize: 13, color: '#888', fontWeight: '600' },
  tabButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  previewTabBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  previewTabBtnText: { fontSize: 14, fontWeight: '700', color: '#444' },

  mockupCanvas: {
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  mainThumbWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  mainThumbImage: {
    ...StyleSheet.absoluteFill,
  },
  mainThumbOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    gap: 8,
  },
  badgeNew: {
    alignSelf: 'flex-start',
    backgroundColor: RED,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeNewText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  mainThumbTitle: { color: '#fff', fontWeight: '800' },
  playCenterBtn: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mockupFooter: {
    padding: 20,
    gap: 16,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  channelInfo: { flex: 1, gap: 2 },
  channelTitle: { fontSize: 16, fontWeight: '800' },
  channelSubs: { fontSize: 12 },
  folderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  folderBadgeText: { fontSize: 13, fontWeight: '800' },

  subThumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  subThumbItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subThumbImg: { width: 64, height: 40, borderRadius: 6 },
  subThumbTime: { fontSize: 12, fontWeight: '600' },
  alertPillMock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  alertPillText: { fontSize: 12, fontWeight: '700' },

  // 기능 카드 섹션
  sectionContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 64,
  },
  sectionHeaderCentered: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  sectionPill: {
    color: RED,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  cardGrid: { gap: 20 },
  cardGridWide: { flexDirection: 'row' },
  featureVisualCard: {
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },
  cardImageHolder: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImg: { width: '100%', height: '100%' },
  cardOverlayTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardOverlayTagText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardBody: { padding: 22, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardDesc: { fontSize: 14, lineHeight: 22 },

  // Before & After
  compareBox: {
    borderRadius: 24,
    overflow: 'hidden',
    gap: 12,
  },
  compareBoxWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareCol: {
    flex: 1,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
  },
  compareEmoji: { fontSize: 40 },
  compareHeading: { fontSize: 20, fontWeight: '800' },
  compareParagraph: { fontSize: 14, textAlign: 'center', lineHeight: 22, color: '#666' },
  compareDivider: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  compareDividerText: { fontSize: 13, fontWeight: '900', color: '#999' },

  // 바닥 밴드
  bottomBand: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 14,
  },
  bottomBandTitle: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  bottomBandSub: { color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'center' },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bottomWhiteBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bottomWhiteBtnText: { color: NAVY, fontSize: 15, fontWeight: '800' },
  bottomOutlineBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bottomOutlineBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // 푸터
  footerWrap: {
    marginTop: 48,
    alignItems: 'center',
    gap: 10,
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerLinkText: { fontSize: 13, fontWeight: '700' },
  copyText: { fontSize: 12, textAlign: 'center', maxWidth: 500, lineHeight: 18 },

  // 인증 카드
  authContainer: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  authCard: {
    borderRadius: 24,
    padding: 24,
  },
});
