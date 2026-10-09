/**
 * 채널별 '볼 시간' 알림 — 휴대폰(iOS·Android) 구현.
 * 운영체제에 반복 알림을 예약하므로 앱이 꺼져 있어도 정해진 시각에 알림이 온다.
 * 웹 구현은 alerts.web.ts (Metro 가 플랫폼별로 골라 쓴다).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ChannelAlert } from '@/types';
import { alertMonthDays, alertWeekdays } from '@/utils/alert-time';

export interface AlertEntry {
  channelId: string;
  title: string;
  alert: ChannelAlert;
}

/** 웹처럼 앱 안에서 시각을 직접 확인해야 하는가 (휴대폰은 OS 가 알아서 울린다). */
export const ALERTS_RUN_IN_APP = false;

const ID_PREFIX = 'channel-alert-';
const ANDROID_CHANNEL = 'watch-time';
let prepared = false;

async function prepare() {
  if (prepared) return;
  prepared = true;
  // 앱을 보고 있는 중에 울려도 배너로 보여 준다.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Android 8+ 는 알림 채널이 있어야 하고, Android 13 은 채널이 있어야 권한 요청 창이 뜬다.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: '볼 시간 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureAlertPermission(): Promise<boolean> {
  await prepare();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** 알림 하나에 필요한 OS 예약들 (요일·날짜를 여러 개 고르면 하나씩). */
function triggersFor(alert: ChannelAlert): Notifications.SchedulableNotificationTriggerInput[] {
  const { hour, minute } = alert;
  if (alert.freq === 'daily') {
    return [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: ANDROID_CHANNEL }];
  }
  if (alert.freq === 'weekly') {
    return alertWeekdays(alert).map((weekday) => ({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday, // 1=일 … 7=토
      hour,
      minute,
      channelId: ANDROID_CHANNEL,
    }));
  }
  return alertMonthDays(alert).map((day) => ({
    type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
    day,
    hour,
    minute,
    channelId: ANDROID_CHANNEL,
  }));
}

/** 저장된 알림 설정과 OS 예약을 맞춘다: 이 앱이 만든 예약을 모두 지우고 다시 건다. */
export async function syncAlertSchedule(entries: AlertEntry[]): Promise<void> {
  await prepare();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (entries.length === 0) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  for (const e of entries) {
    const triggers = triggersFor(e.alert);
    for (let i = 0; i < triggers.length; i++) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${e.channelId}-${i}`,
        content: {
          title: `📺 ${e.title}`,
          body: '볼 시간이에요! 새 영상을 확인해 보세요.',
          data: { channelId: e.channelId },
        },
        trigger: triggers[i],
      });
    }
  }
}

/** 휴대폰에서는 OS 가 예약대로 띄우므로 앱이 직접 띄울 일이 없다. */
export function showAlertNow(_title: string, _body: string): boolean {
  return false;
}
