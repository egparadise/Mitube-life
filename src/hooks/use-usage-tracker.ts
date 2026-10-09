import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { showAlertNow } from '@/services/alerts';
import { useStore } from '@/store/store';

const TICK_SEC = 15;

/** 브라우저 알림이 안 되면 화면 안내창으로 대신 알린다. */
function notify(title: string, body: string) {
  if (showAlertNow(title, body)) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`${title}
${body}`);
}

/** 오늘 Shorts 한도를 다 썼는지. */
export function shortsLimitReached(): boolean {
  const { adminSettings: a, usage } = useStore.getState();
  const today = new Date().toLocaleDateString('sv-SE');
  return a.shortsLimitOn && usage.date === today && usage.shortsSec >= a.shortsLimitMin * 60;
}

/**
 * 앱을 보고 있는 동안 사용 시간을 센다 (시간 관리 · 일일 한도).
 * 한도를 처음 넘는 순간 한 번 알린다.
 */
export function useUsageTracker() {
  useEffect(() => {
    let active = AppState.currentState === 'active';
    const sub = AppState.addEventListener('change', (s) => (active = s === 'active'));
    const timer = setInterval(() => {
      const visible = Platform.OS === 'web' ? typeof document !== 'undefined' && document.visibilityState === 'visible' : active;
      if (!visible) return;
      const st = useStore.getState();
      const a = st.adminSettings;
      const today = new Date().toLocaleDateString('sv-SE');
      const before = st.usage.date === today ? st.usage : { appSec: 0, shortsSec: 0 };
      const shorts = st.viewingShorts ? TICK_SEC : 0;
      st.addUsage(TICK_SEC, shorts);
      if (!a.notifyTimeLimit) return;
      const crossed = (prev: number, add: number, limitMin: number) => prev < limitMin * 60 && prev + add >= limitMin * 60;
      if (a.dailyLimitOn && crossed(before.appSec, TICK_SEC, a.dailyLimitMin)) {
        notify('⏳ 마이 튜브', `오늘 정한 ${a.dailyLimitMin}분을 다 봤어요. 잠깐 쉬어 갈까요?`);
      }
      if (a.shortsLimitOn && shorts && crossed(before.shortsSec, shorts, a.shortsLimitMin)) {
        notify('⚡ Shorts', `오늘 Shorts ${a.shortsLimitMin}분을 다 봤어요. 내일 다시 만나요!`);
      }
    }, TICK_SEC * 1000);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
}
