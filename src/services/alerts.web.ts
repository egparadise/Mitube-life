/**
 * 채널별 '볼 시간' 알림 — 웹 구현.
 * 브라우저에는 앱이 닫혀 있을 때 반복 알림을 예약할 방법이 없으므로,
 * 페이지가 열려 있는 동안 앱이 시각을 확인해(useInAppAlerts) 브라우저 알림 + 화면 배너로 알린다.
 */
import { useStore } from '@/store/store';
import { ChannelAlert } from '@/types';

export interface AlertEntry {
  channelId: string;
  title: string;
  alert: ChannelAlert;
}

export const ALERTS_RUN_IN_APP = true;

function supported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 브라우저 알림 권한. 거절돼도 화면 안 배너로는 계속 알린다. */
export async function ensureAlertPermission(): Promise<boolean> {
  if (!supported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** 웹은 OS 예약이 없으므로 할 일이 없다. */
export async function syncAlertSchedule(_entries: AlertEntry[]): Promise<void> {}

/** 브라우저 알림을 바로 띄운다. 권한이 없으면 false. */
export function showAlertNow(title: string, body: string): boolean {
  // 관리자 설정 → 알림 → '이 브라우저에서 알림 받기'가 꺼져 있으면 띄우지 않는다.
  if (!useStore.getState().adminSettings.desktopNotify) return false;
  if (!supported() || Notification.permission !== 'granted') return false;
  const n = new Notification(title, { body });
  n.onclick = () => {
    window.focus();
    n.close();
  };
  return true;
}
