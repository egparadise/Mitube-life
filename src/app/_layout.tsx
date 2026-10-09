import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { LandingScreen } from '@/components/landing/landing-screen';
import { useUsageTracker } from '@/hooks/use-usage-tracker';
import { useStore } from '@/store/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
        <LandingGate />
        <UsageTracker />
      </AuthProvider>
    </ThemeProvider>
  );
}

/** 시간 관리(일일 한도)용 사용 시간 측정. */
function UsageTracker() {
  useUsageTracker();
  return null;
}

/**
 * 처음 방문했거나 로그인 화면을 연 경우, 앱 위에 소개 페이지(로그인·가입)를 덮어 보여 준다.
 * 탭 내비게이터는 아래에 그대로 두어 라우팅이 끊기지 않게 한다.
 */
function LandingGate() {
  const hydrated = useStore((s) => s.hydrated);
  const introDone = useStore((s) => s.introDone);
  const signupInProgress = useStore((s) => s.signupInProgress);
  const landingMode = useStore((s) => s.landingMode);
  const { session } = useAuth();

  if (!hydrated || introDone) return null;

  return (
    <LandingScreen
      key={landingMode}
      initialMode={landingMode}
      onEnter={() => useStore.getState().setIntroDone(true)}
    />
  );
}
